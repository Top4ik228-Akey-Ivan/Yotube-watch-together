import { makeAutoObservable, runInAction } from "mobx";
import type { RootStore } from "./rootStore";
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { peerConfig } from "../configs/peerConfig";

export class P2PStore {
    private rootStore: RootStore;

    roomId: string | null = null;            // ID комнаты (Peer-ID Хоста)
    peerInstance: Peer | null = null;         // Экземпляр PeerJS
    connection: DataConnection | null = null; // Канал связи со вторым плеером
    isPeerConnected: boolean = false;         // Подключен ли друг прямо сейчас
    isConnecting: boolean = false;           // Идет ли процесс подключения (для лоадера)

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    initRoomAsHost(videoUrl: string) {
        this.isConnecting = true;
        this.rootStore.playbackStore.setVideoUrl(videoUrl);

        this.peerInstance = new Peer(peerConfig);

        this.peerInstance.on("error", (err) => {
            console.error(err);
        });

        this.peerInstance.on('open', (generatedId: string) => {
            runInAction(() => {
                this.roomId = generatedId;
                this.isConnecting = false;

                const newUrl = `${window.location.origin}${window.location.pathname}?room=${generatedId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                console.log('open and ID', generatedId);
            });
        });

        this.peerInstance.on('connection', (conn) => {
            runInAction(() => {
                this.connection = conn;
                this.setupConnectionListeners();
                console.log('connection and conn', conn)
            });
        });
    }

    connectToRoomAsGuest(roomId: string) {
        this.isConnecting = true;
        this.roomId = roomId;

        this.peerInstance = new Peer(peerConfig);

        this.peerInstance.on("error", (err) => {
            console.error(err);
        });

        this.peerInstance.on('open', () => {
            const conn = this.peerInstance!.connect(roomId);

            runInAction(() => {
                this.connection = conn;
                this.setupConnectionListeners();
            })
        })
    }

    private setupConnectionListeners() {
        if (!this.connection) return;

        // Когда случилось подключение
        this.connection.on('open', () => {
            runInAction(() => {
                this.isPeerConnected = true;
                this.isConnecting = false;
            });

            if (this.rootStore.userStore.isHost) {
                this.connection!.send({
                    type: 'INIT_STATE',
                    videoUrl: this.rootStore.playbackStore.videoUrl,
                    username: this.rootStore.userStore.username
                });

                this.connection!.send({
                    type: 'SYSTEM_WELCOME',
                    text: `Привет от хоста ${this.rootStore.userStore.username}`
                })
            } else {
                this.connection!.send({
                    type: 'GUEST_INTRO',
                    username: this.rootStore.userStore.username
                })
                this.connection!.send({
                    type: 'SYSTEM_WELCOME',
                    text: `Привет! Я Гость ${this.rootStore.userStore.username}`,
                });
            }
        });
        this.connection.on('data', (data: any) => {
            this.handleIncomingNetworkData(data);
        });
        this.connection.on("error", (err) => {
            console.error(err);
        });

        this.connection.on('close', () => {
            runInAction(() => {
                this.isPeerConnected = false;
                this.rootStore.userStore.setFriendUsername('');
            });
        });
    }

    private handleIncomingNetworkData(packet: any) {
        if (!packet || !packet.type) return;

        switch (packet.type) {
            case 'INIT_STATE':
                runInAction(() => {
                    this.rootStore.playbackStore.setVideoUrl(packet.videoUrl);
                    this.rootStore.userStore.setFriendUsername(packet.username);

                    const currentGuestName = this.rootStore.userStore.username || 'Гость';
                    this.rootStore.userStore.loginUser(currentGuestName, false);
                });
                break;

            case 'GUEST_INTRO':
                this.rootStore.userStore.setFriendUsername(packet.username);
                break;

            case 'SYSTEM_WELCOME':
                console.log(`System Welcome ${packet.text}`)
                break;

            case 'PLAY':
                this.rootStore.playbackStore.setIsPlaying(true, true);
                break;

            case 'PAUSE':
                this.rootStore.playbackStore.setIsPlaying(false, true);
                break;
        }
    };

    // Отправка сетевых команд (Отправляем сигналы другу)
    sendNetworkEvent(type: 'PLAY' | 'PAUSE' | 'SYSTEM_WELCOME', payload?: any) {
        if (this.connection && this.isPeerConnected) {
            this.connection.send({
                type,
                ...payload,
            });
        }
    }
};