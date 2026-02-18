import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProfile } from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      userInfo: null,
      token: null,
      login: (userInfo, token) => set({ userInfo, token }),
      logout: () => set({ userInfo: null, token: null }),
      setUserInfo: (userInfo) => set({ userInfo }),

      // Refresh profile from server to sync new fields (like role)
      refreshProfile: async () => {
        try {
          const token = get().token;
          if (!token) return;
          
          const profile = await getProfile();
          const currentInfo = get().userInfo;
          
          // Merge server data with current info (keeps token separate)
          set({
            userInfo: {
              ...currentInfo,
              ...profile,
            }
          });
        } catch (err) {
          // Silent fail — don't break the app if profile fetch fails
          console.warn('Profile refresh failed:', err.message);
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);