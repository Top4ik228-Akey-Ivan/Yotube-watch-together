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
        this.setupPeerListeners();

        this.peerInstance.on('open', (generatedId: string) => {
            runInAction(() => {
                this.roomId = generatedId;
                this.isConnecting = false;

                const newUrl = `${window.location.origin}${window.location.pathname}?room=${generatedId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                console.log('open peer', generatedId);
            });
        });

        this.peerInstance.on('connection', (conn) => {
            runInAction(() => {
                this.connection = conn;
            });
            this.setupConnectionListeners();
        });
    }

    connectToRoomAsGuest(roomId: string) {
        this.isConnecting = true;
        this.roomId = roomId;

        this.peerInstance = new Peer(peerConfig);
        this.setupPeerListeners();

        this.peerInstance.on('open', () => {
            this.attemptConnect(roomId);
        })
    }

    private attemptConnect(roomId: string, retriesLeft: number = 3) {
        const conn = this.peerInstance!.connect(roomId, { reliable: true });

        // once, а не on — обработчик должен сработать максимум один раз за попытку,
        // иначе при следующих ошибках/ретраях они будут накапливаться и дублироваться
        const onError = (err: any) => {
            console.error('[P2P] Peer error during connect:', err.type, err);
            if (err.type === 'peer-unavailable' && retriesLeft > 0) {
                console.log('[P2P] Peer not ready yet, retrying in 1.5s...');
                setTimeout(() => this.attemptConnect(roomId, retriesLeft - 1), 1500);
            } else {
                runInAction(() => {
                    this.isConnecting = false;
                });
            }
        };

        this.peerInstance!.once('error', onError);

        // Если соединение всё же откроется успешно — снимаем обработчик ошибки,
        // чтобы он не сработал позже на не связанной с этим подключением ошибке
        conn.once('open', () => {
            this.peerInstance!.off('error', onError);
        });

        runInAction(() => {
            this.connection = conn;
        });
        this.setupConnectionListeners();
    }

    private setupPeerListeners() {
        if (!this.peerInstance) return;

        this.peerInstance.on("error", (err) => {
            console.error(err);
            runInAction(() => {
                this.isConnecting = false;
            });
        });

        this.peerInstance.on("disconnected", () => {

            runInAction(() => {
                this.isPeerConnected = false;
            });
        });

        this.peerInstance.on("close", () => {
            runInAction(() => {
                this.roomId = null;
                this.isPeerConnected = false;
                this.connection = null;
                this.peerInstance = null;
            });
        });
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
            runInAction(() => {
                this.isPeerConnected = false;
            });
        });

        this.connection.on('close', () => {
            runInAction(() => {
                this.connection = null;
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
                console.log("NETWORK PLAY");
                this.rootStore.playbackStore.setIsPlaying(true, true, packet.time);
                break;

            case 'PAUSE':
                console.log("NETWORK PAUSE");
                this.rootStore.playbackStore.setIsPlaying(false, true, packet.time);
                break;

            case "SEEK":
                console.log("NETWORK SEEK");
                this.rootStore.playbackStore.seekTo(packet.time, true);
                break;
        }
    };

    // Отправка сетевых команд (Отправляем сигналы другу)
    sendNetworkEvent(type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SYSTEM_WELCOME', payload?: any) {
        if (this.connection && this.isPeerConnected) {
            this.connection.send({
                type,
                ...payload,
            });
        }
    }
};