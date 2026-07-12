import { observer } from "mobx-react-lite";
import { rootStore } from "../stores/rootStore";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";
import { useEffect } from "react";

const PlayerPage: React.FC = observer(() => {
    const { playbackStore, userStore, p2pStore } = rootStore;

    const onReady: YouTubeProps["onReady"] = (event) => {
        console.log("READY");
        playbackStore.setYoutubePlayerInstance(event.target);
    };

    const onPlay: YouTubeProps["onPlay"] = () => {
        console.log("ON PLAY");
        playbackStore.setIsPlaying(true, false);
    };

    const onPause: YouTubeProps["onPause"] = () => {
        console.log("ON PAUSE");
        playbackStore.setIsPlaying(false, false);
    };

    useEffect(() => {
        return () => {
            playbackStore.stopTimeTracking();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0f0f14] text-white">
            <header className="flex flex-col gap-3 px-4 py-3 border-b border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-8 sm:py-4">
                <div className="flex items-center justify-between sm:block">
                    <div className="font-semibold truncate max-w-35 sm:max-w-none">
                        {userStore.username}
                    </div>
                    <div className="text-sm text-gray-400">
                        {userStore.isHost ? "Хост" : "Гость"}
                    </div>
                </div>

                <div className="text-center order-first sm:order-0">
                    <div className="text-sm text-gray-400">
                        Комната
                    </div>
                    <div className="font-mono text-xs sm:text-sm break-all">
                        {p2pStore.roomId}
                    </div>
                </div>

                <div className="flex items-center justify-between sm:block sm:text-right">
                    <div className="font-semibold truncate max-w-35 sm:max-w-none">
                        {p2pStore.isPeerConnected
                            ? userStore.friendUsername
                            : "🟡 Ожидание подключения"}
                    </div>
                    <div className="text-sm text-gray-400">
                        {!userStore.isHost ? "Хост" : "Гость"}
                    </div>
                </div>
            </header>

            {!userStore.isHost && p2pStore.isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <div className="font-semibold">Вы подключаетесь к хосту...</div>
                    </div>
                </div>
            )}

            <main className="flex justify-center px-4 py-6 sm:py-10">
                <div className="w-full max-w-240 aspect-video">
                    <YouTube
                        videoId={playbackStore.videoId}
                        opts={{
                            width: "100%",
                            height: "100%",
                            playerVars: {
                                origin: window.location.origin,
                            },
                        }}
                        className="w-full h-full"
                        iframeClassName="w-full h-full"
                        onReady={onReady}
                        onPlay={onPlay}
                        onPause={onPause}
                    />
                </div>
            </main>
        </div>
    );
});

export default PlayerPage;