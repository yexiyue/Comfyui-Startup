import { Plugin } from "@/api/plugin";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = {
  downloadPlugins: {
    [key: string]: Plugin;
  };
};

type Action = {
  addPlugin: (plugin: Plugin) => void;
  setPlugins: (plugins: Plugin[]) => void;
  removePlugin: (plugin: Plugin) => void;
};

export const usePluginStore = create(
  persist(
    immer<State & Action>((set) => ({
      downloadPlugins: {},
      addPlugin(plugin) {
        set((state) => {
          state.downloadPlugins[plugin.reference] = plugin;
        });
      },
      setPlugins: (plugins: Plugin[]) => {
        const downloadPlugins: Record<string, Plugin> = {};
        plugins.forEach((plugin) => {
          downloadPlugins[plugin.reference] = plugin;
        });
        set({
          downloadPlugins,
        });
      },
      removePlugin: (plugin: Plugin) => {
        set((state) => {
          delete state.downloadPlugins[plugin.reference];
        });
      },
    })),
    { name: "plugin-store" }
  )
);

type DownloadingPluginsState = {
  downloadingPlugins: {
    [key: string]: Plugin;
  };
  downloadingPluginProgress: {
    [key: string]: number;
  };
  setDownloadingPluginProgress: (reference: string, progress: number) => void;
  addDownloadingPlugin: (plugin: Plugin) => void;
  removeDownloadingPlugin: (reference: string) => void;
};

// 管理下载中的插件
export const useDownloadingPlugins = create(
  immer<DownloadingPluginsState>((set) => ({
    downloadingPlugins: {},
    downloadingPluginProgress: {},
    setDownloadingPluginProgress(reference, progress) {
      set((state) => {
        state.downloadingPluginProgress[reference] = progress;
      });
    },
    addDownloadingPlugin: (plugin) => {
      set((state) => {
        state.downloadingPlugins[plugin.reference] = plugin;
      });
    },
    removeDownloadingPlugin: (reference) => {
      set((state) => {
        delete state.downloadingPlugins[reference];
        delete state.downloadingPluginProgress[reference];
      });
    },
  }))
);
