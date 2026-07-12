import type { PeerJSOption } from "peerjs";

export const peerConfig: PeerJSOption = {
    host: "yotube-watch-together-peer-server.onrender.com",
    secure: true,
    port: 443,
    path: "/peerjs",

    config: {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    },
};