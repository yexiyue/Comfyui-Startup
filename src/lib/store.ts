import { command } from "@/api";
import { StateStorage } from "zustand/middleware";

export const tauriStore: StateStorage = {
  getItem: async (key: string) => {
    return await command("get_item", { key });
  },
  removeItem: async (key: string) => {
    await command("remove_item", { key });
  },
  setItem: async (key: string, value: string) => {
    await command("set_item", { key, value: JSON.stringify(value) });
    await command("save");
  },
};
