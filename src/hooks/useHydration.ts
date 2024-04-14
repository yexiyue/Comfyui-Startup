import { tauriStore } from "@/lib/store";
import { useModelDownloadStore } from "@/pages/model/useStore";
import { usePluginStore } from "@/pages/plugin/useStore";
import { useConfigStore } from "@/useStore";
import { useAsyncEffect } from "ahooks";
import { useEffect, useState } from "react";
import { StoreApi } from "zustand";

const stores: [string, StoreApi<any>, (...args: any[]) => void][] = [
  [
    useConfigStore.persist.getOptions().name!,
    useConfigStore,
    useConfigStore.setState,
  ],
  [
    useModelDownloadStore.persist.getOptions().name!,
    useModelDownloadStore,
    useModelDownloadStore.setState,
  ],
  [
    usePluginStore.persist.getOptions().name!,
    usePluginStore,
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
    stores.forEach(async ([storeName, store]) => {
      store.subscribe(async (state) => {
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
    });
  }, []);

  return hydrated;
};
