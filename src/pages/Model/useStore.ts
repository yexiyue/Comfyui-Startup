import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Model, ModelStatus } from "@/api/model";

type ModelDownloadStore = {
  downloadingModels: Record<string, Model>;

  addDownloadingModel: (model: Model) => void;
  setProgress: (url: string, progress: number, status?: ModelStatus) => void;
  removeDownloadingModel: (url: string) => void;
};

export const useModelDownloadStore = create(
  persist(
    immer<ModelDownloadStore>((set,) => ({
      downloadingModels: {},
      addDownloadingModel(model) {
        set((state) => {
          state.downloadingModels[model.url] = {
            ...model,
            progress: 0,
            status: "pending",
          };
        });
      },
      setProgress(url, progress, status) {
        set((state) => {
          state.downloadingModels[url].progress = progress;
          if (status) {
            state.downloadingModels[url].status = status;
          }
        });
      },
      removeDownloadingModel(url) {
        set((state) => {
          delete state.downloadingModels[url];
        });
      },
    })),
    {
      name: "model-download",
    }
  )
);
