import { P2PStore } from './p2pStore';
import { PlaybackStore } from './playbackStore';
import { UserStore } from './userStore';

export class RootStore {
  userStore: UserStore;
  playbackStore: PlaybackStore;
  p2pStore: P2PStore;

  constructor() {
    this.userStore = new UserStore(this);
    this.playbackStore = new PlaybackStore(this);
    this.p2pStore = new P2PStore(this);
  }
}

export const rootStore = new RootStore();
