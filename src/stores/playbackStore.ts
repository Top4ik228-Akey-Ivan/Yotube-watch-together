import { makeAutoObservable } from "mobx";
import type { RootStore } from "./rootStore";

export class PlaybackStore {
    private rootStore: RootStore;

    videoUrl: string = '';
    isPlaying: boolean = false;
    currentTime: number = 0;

    youtubePlayerInstance: any = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    };

    setVideoUrl(url: string) {
        this.videoUrl = url;
    };

    // isFromNetwoek нужнен, чтобы не сделать бесконечный цикл
    setIsPlaying(isPlaying: boolean, isFromNetwork: boolean = false) {
        this.isPlaying = isPlaying;

        if (this.youtubePlayerInstance) {
            if (isPlaying) {
                this.youtubePlayerInstance.playVideo();
            } else {
                this.youtubePlayerInstance.pauseVideo();
            }
        };

        if (!isFromNetwork && this.rootStore.p2pStore.isPeerConnected) {
            this.rootStore.p2pStore.sendNetworkEvent(isPlaying ? 'PLAY' : 'PAUSE', {
                time: this.currentTime
            });
        };
    };

    updateLocalTime(seconds: number) {
        this.currentTime = seconds;
    };

    setYoutubePlayerInstance(player: any) {
        this.youtubePlayerInstance = player;
    }
}