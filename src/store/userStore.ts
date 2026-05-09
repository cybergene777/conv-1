// src/store/userStore.ts
// 全局用户信息状态，供导航栏、账户页等共享

import { create } from "zustand";

export interface UserInfo {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  plan: "FREE" | "PRO";
  remaining: number | null;
  freeLimit: number;
  createdAt: string;
}

interface UserStore {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  updateAvatar: (url: string) => void;
  updateNickname: (nickname: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateAvatar: (url) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatar: url } : null,
    })),
  updateNickname: (nickname) =>
    set((state) => ({
      user: state.user ? { ...state.user, nickname } : null,
    })),
  clearUser: () => set({ user: null }),
}));
