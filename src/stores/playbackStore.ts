import { makeAutoObservable } from "mobx";
import type { RootStore } from "./rootStore";

export class PlaybackStore {
    private rootStore: RootStore;
    private trackingInterval: number | null = null;
    private ignoreNextSeek = false;

    videoUrl: string = '';
    isPlaying: boolean = false;
    currentTime: number = 0;

    youtubePlayerInstance: any = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    };

    get videoId() {
        try {
            const url = new URL(this.videoUrl);

            if (url.hostname === "youtu.be") {
                return url.pathname.slice(1);
            }

            return url.searchParams.get("v") ?? "";
        } catch {
            return "";
        }
    }

    setVideoUrl(url: string) {
        this.videoUrl = url;
    };

    // isFromNetwoek нужнен, чтобы не сделать бесконечный цикл
    setIsPlaying(isPlaying: boolean, isFromNetwork: boolean, time?: number,) {

        if (this.isPlaying === isPlaying) {
            return;
        }

        this.isPlaying = isPlaying;

        if (this.youtubePlayerInstance && isFromNetwork) {
            if (time !== undefined) {
                this.youtubePlayerInstance.seekTo(time, true);
            }
            if (isPlaying) {
                this.youtubePlayerInstance.playVideo();
            } else {
                this.youtubePlayerInstance.pauseVideo();
            }
        };

        if (!isFromNetwork && this.rootStore.p2pStore.isPeerConnected) {
            this.rootStore.p2pStore.sendNetworkEvent(isPlaying ? 'PLAY' : 'PAUSE', {
                time: this.youtubePlayerInstance.getCurrentTime()
            });
        };
    };

    seekTo(seconds: number, isFromNetwork: boolean) {
        this.currentTime = seconds;

        if (this.youtubePlayerInstance && isFromNetwork) {
            this.ignoreNextSeek = true;
            this.youtubePlayerInstance.seekTo(seconds, true);
        }
        if (!isFromNetwork && this.rootStore.p2pStore.isPeerConnected) {
            this.rootStore.p2pStore.sendNetworkEvent('SEEK', {
                time: seconds
            });
        };
    }

    setYoutubePlayerInstance(player: any) {
        this.youtubePlayerInstance = player;
        this.startTimeTracking();
    }

    startTimeTracking() {
        if (this.trackingInterval) return;

        this.trackingInterval = window.setInterval(() => {
            if (!this.youtubePlayerInstance) return;

            const time = this.youtubePlayerInstance.getCurrentTime();

            if (this.ignoreNextSeek) {
                this.currentTime = time;
                this.ignoreNextSeek = false;
                return;
            }

            if (Math.abs(time - this.currentTime) > 1.5) {
                this.seekTo(time, false);
            }

            this.currentTime = time;
        }, 250);
    }

    stopTimeTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    updateLocalTime(seconds: number) {
        this.currentTime = seconds;
    };
}