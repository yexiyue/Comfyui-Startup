import { Plugin } from "@/api/plugin";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  persist<State & Action>(
    (set, get) => ({
      downloadPlugins: {},
      addPlugin(plugin) {
        set({
          downloadPlugins: {
            ...get().downloadPlugins,
            [plugin.reference]: plugin,
          },
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
        const plugins = {
          ...get().downloadPlugins,
        };
        delete plugins[plugin.reference];
        set({
          downloadPlugins: plugins,
        });
      },
    }),
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
export const useDownloadingPlugins = create<DownloadingPluginsState>((set) => ({
  downloadingPlugins: {},
  downloadingPluginProgress: {},
  setDownloadingPluginProgress(reference, progress) {
    set((state) => ({
      downloadingPluginProgress: {
        ...state.downloadingPluginProgress,
        [reference]: progress,
      },
    }));
  },
  addDownloadingPlugin: (plugin) => {
    set((state) => ({
      downloadingPlugins: {
        ...state.downloadingPlugins,
        [plugin.reference]: plugin,
      },
    }));
  },
  removeDownloadingPlugin: (reference) => {
    set((state) => {
      delete state.downloadingPlugins[reference];
      delete state.downloadingPluginProgress[reference];
      return {
        downloadingPlugins: { ...state.downloadingPlugins },
        downloadingPluginProgress: { ...state.downloadingPluginProgress },
      };
    });
  },
}));
