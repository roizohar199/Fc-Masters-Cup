import { create } from "zustand";

type State = { 
  tournamentId: string | null;
  setTournamentId: (id: string | null) => void;
};

export const useStore = create<State>((set) => ({
  tournamentId: null,
  setTournamentId: (id: string | null) => set({ tournamentId: id }),
}));

