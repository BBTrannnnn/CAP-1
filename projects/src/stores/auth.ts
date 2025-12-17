import { create } from 'zustand';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  trustScore?: number;
  isActive?: boolean;
  isBanned?: boolean;
  bannedReason?: string;
  bannedUntil?: string;
}

type AuthState = {
  signedIn: boolean;
  user: UserInfo | null;
  signIn: (user: UserInfo) => void;
  signOut: () => void;
  setUser: (user: UserInfo) => void;
};

export const useAuth = create<AuthState>((set) => ({
  signedIn: false,
  user: null,
  signIn: (user) => set({ signedIn: true, user }),
  signOut: () => set({ signedIn: false, user: null }),
  setUser: (user) => set({ user }),
}));
