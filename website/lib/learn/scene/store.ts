import { create } from "zustand";

/**
 * Tracks which scene currently owns playback so at most one animation runs at
 * a time. Starting any scene makes it active; others stop advancing.
 */
interface SceneStore {
  active: string | null;
  setActive: (id: string) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  active: null,
  setActive: (id) => set({ active: id }),
}));
