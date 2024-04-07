import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";


export const useModelDownloadStore = create(
  persist(
    immer((set, get) => ({})),
    {
      name: "model-download",
    }
  )
);
