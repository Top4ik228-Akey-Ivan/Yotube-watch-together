import { observer } from "mobx-react-lite";
import { rootStore } from "../stores/rootStore";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

const PlayerPage: React.FC = observer(() => {
    const { playbackStore, userStore, p2pStore } = rootStore;

    const onReady: YouTubeProps["onReady"] = (event) => {
        playbackStore.setYoutubePlayerInstance(event.target);
    };

    const onPlay: YouTubeProps["onPlay"] = () => {
        playbackStore.setIsPlaying(true);
    };

    const onPause: YouTubeProps["onPause"] = () => {
        playbackStore.setIsPlaying(false);
    };

    return (
        <div className="min-h-screen bg-[#0f0f14] text-white">

            <header className="flex justify-between items-center px-8 py-4 border-b border-gray-800">

                <div>
                    <div className="font-semibold">
                        {userStore.username}
                    </div>

                    <div className="text-sm text-gray-400">
                        {userStore.isHost ? "Хост" : "Гость"}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-gray-400">
                        Комната
                    </div>

                    <div className="font-mono">
                        {p2pStore.roomId}
                    </div>
                </div>

                <div>
                    <div className="font-semibold">
                        {p2pStore.isPeerConnected
                            ? userStore.friendUsername
                            : "🟡 Ожидание подключения"}
                    </div>
                    <div className="text-sm text-gray-400">
                        {!userStore.isHost ? "Хост" : "Гость"}
                    </div>
                </div>

            </header>

            <main className="flex justify-center py-10">

                <YouTube
                    videoId={playbackStore.videoId}
                    opts={{
                        width: "960",
                        height: "540",
                        playerVars: {
                            origin: window.location.origin,
                        },
                    }}
                    onReady={onReady}
                    onPlay={onPlay}
                    onPause={onPause}
                />

            </main>

        </div>
    );
});

export default PlayerPage;