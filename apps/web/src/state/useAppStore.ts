import { create } from "zustand";

type Role = "host" | "player" | "admin" | null;

type AppState = {
  role: Role;
  roomCode: string;
  playerName: string;

  setRole: (role: Role) => void;
  setRoomCode: (roomCode: string) => void;
  setPlayerName: (playerName: string) => void;

  resetSession: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  role: null,
  roomCode: "",
  playerName: "",

  setRole: (role) => set({ role }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerName: (playerName) => set({ playerName }),

  resetSession: () => set({ role: null, roomCode: "", playerName: "" }),
}));
