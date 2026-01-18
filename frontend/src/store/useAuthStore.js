import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      login: (userInfo, token) => set({ userInfo, token }),
      logout: () => set({ userInfo: null, token: null }),
      setUserInfo: (userInfo) => set({ userInfo }),
    }),
    {
      name: 'auth-storage', // name of item in localStorage
      getStorage: () => localStorage, // use localStorage
    }
  )
);