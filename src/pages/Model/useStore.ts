import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Model, ModelStatus } from "@/api/model";

type ModelDownloadStore = {
  downloadingModels: Record<string, Model>;
  addDownloadingModel: (model: Model, taskId: number) => void;
  setProgress: (
    url: string,
    progress: [number, number] | null,
    status: ModelStatus,
    speed: number | null
  ) => void;
  removeDownloadingModel: (url: string) => void;
  setDownloadingModel: (model: Model[]) => void;

  downloadedModels: Record<string, Model>;
  addDownloadedModel: (model: Model) => void;
  removeDownloadedModel: (url: string) => void;
  setDownloadedModel: (model: Model[]) => void;
};

export const useModelDownloadStore = create(
  persist(
    immer<ModelDownloadStore>((set) => ({
      downloadingModels: {},
      downloadedModels: {},
      // downloading
      addDownloadingModel(model, taskId) {
        set((state) => {
          state.downloadingModels[model.url] = {
            ...model,
            status: "pending",
            taskId,
          };
        });
      },
      setProgress(url, progress, status, speed) {
        set((state) => {
          if (status === "running") {
            state.downloadingModels[url].progress = progress;
          }
          state.downloadingModels[url].status = status;
          state.downloadingModels[url].speed = speed;
        });
      },
      removeDownloadingModel(url) {
        set((state) => {
          delete state.downloadingModels[url];
        });
      },
      setDownloadingModel(model) {
        set((state) => {
          model.forEach((item) => {
            state.downloadingModels[item.url] = item;
          });
        });
      },
      // downloaded
      addDownloadedModel(model) {
        set((state) => {
          state.downloadedModels[model.url] = model;
        });
      },
      removeDownloadedModel(url) {
        set((state) => {
          delete state.downloadedModels[url];
        });
      },
      setDownloadedModel(model) {
        set((state) => {
          model.forEach((item) => {
            state.downloadedModels[item.url] = item;
          });
        });
      },
    })),
    {
      name: "model-download",
    }
  )
);
