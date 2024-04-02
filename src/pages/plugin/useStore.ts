import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Plugin } from "@/api/plugin";

type State = {
  downloadPlugins: {
    [key: string]: Plugin;
  };
};

type Action = {
  addPlugin: (plugin: Plugin) => void;
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
            [`${plugin.title}-${plugin.reference}`]: plugin,
          },
        });
      },
      removePlugin: (plugin: Plugin) => {
        const plugins = {
          ...get().downloadPlugins,
        };
        delete plugins[`${plugin.title}-${plugin.reference}`];
        set({
          downloadPlugins: plugins,
        });
      },
    }),
    { name: "plugin-store" }
  )
);
