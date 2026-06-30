import { makeAutoObservable } from "mobx";
import type { RootStore } from "./rootStore";

export class UserStore {
    private rootStore: RootStore;

    username: string = '';
    friendUsername:string = '';
    isHost: boolean = false;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        makeAutoObservable(this);
    }

    loginUser(name: string, isHost: boolean) {
        this.username = name;
        this.isHost = isHost;
    }

    setFriendUsername(name: string) {
        this.friendUsername = name;
    }
}