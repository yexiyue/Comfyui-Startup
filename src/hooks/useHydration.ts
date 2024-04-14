import { tauriStore } from "@/lib/store";
import { useModelDownloadStore } from "@/pages/Model/useStore";
import { usePluginStore } from "@/pages/Plugin/useStore";
import { useConfigStore } from "@/useStore";
import { getCurrent } from "@tauri-apps/api/window";
import { useAsyncEffect } from "ahooks";
import { useState, useEffect } from "react";

const stores: [string, () => Record<string, any>, (...args: any[]) => void][] =
  [
    [
      useConfigStore.persist.getOptions().name!,
      useConfigStore.getState,
      useConfigStore.setState,
    ],
    [
      useModelDownloadStore.persist.getOptions().name!,
      useModelDownloadStore.getState,
      useModelDownloadStore.setState,
    ],
    [
      usePluginStore.persist.getOptions().name!,
      usePluginStore.getState,
      usePluginStore.setState,
    ],
  ];

export const useConfigHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useAsyncEffect(async () => {
    const tasks = stores.map(async ([storeName, _, setState]) => {
      const jsonStr = await tauriStore.getItem(storeName);
      if (jsonStr) {
        const state = JSON.parse(JSON.parse(jsonStr));
        setState(state);
      }
    });
    await Promise.allSettled(tasks);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const window = getCurrent();
    window.onCloseRequested(async () => {
      const tasks = stores.map(async ([storeName, store]) => {
        const state = store();
        const value = Object.keys(state).reduce<Record<string, any>>(
          (pre, cur) => {
            if (typeof state[cur] !== "function") {
              pre[cur] = state[cur];
            }
            return pre;
          },
          {}
        );
        await tauriStore.setItem(storeName, JSON.stringify(value));
      });
      await Promise.allSettled(tasks);
    });
  }, []);

  return hydrated;
};
