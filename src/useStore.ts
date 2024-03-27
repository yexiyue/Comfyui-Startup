import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  // 语言
  language: string;
  // comfyui路径
  comfyuiPath: string;
  theme: string;
  firstUse: boolean;
  // 国家
  country: string;
};

type Action = {
  setLanguage: (language: string) => void;
  setFirstUse: (firstUse: boolean) => void;
  setComfyuiPath: (comfyuiPath: string) => void;
  setCountry: (country: string) => void;
};

export const useConfigStore = create(
  persist<State & Action>(
    (set) => ({
      language: "zh",
      theme: "light",
      comfyuiPath: "",
      firstUse: true,
      country: "chinese",
      setLanguage(language) {
        set({ language });
      },
      setFirstUse(firstUse) {
        set({ firstUse });
      },
      setComfyuiPath(comfyuiPath) {
        set({ comfyuiPath });
      },
      setCountry(country) {
        set({ country });
      },
    }),
    {
      name: "configStore",
    }
  )
);
