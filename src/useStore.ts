import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SysInfo } from "./api";

type State = {
  // 语言
  language: string;
  // comfyui路径
  comfyuiPath: string;
  theme: string;
  firstUse: boolean;
  // 国家
  country: string;
  sysInfo?: SysInfo;
  managerExist: boolean;
  // 侧边栏是否展开
  expanded: boolean;
};

type Action = {
  setLanguage: (language: string) => void;
  setFirstUse: (firstUse: boolean) => void;
  setComfyuiPath: (comfyuiPath: string) => void;
  setCountry: (country: string) => void;
  setSysInfo: (sysInfo: State["sysInfo"]) => void;
  setManagerExist: (managerExist: boolean) => void;
  setExpanded: (expanded: boolean) => void;
};

export const useConfigStore = create(
  persist<State & Action>(
    (set) => ({
      language: "zh",
      theme: "light",
      comfyuiPath: "",
      firstUse: true,
      country: "chinese",
      sysInfo: undefined,
      managerExist: false,
      expanded: true,
      setSysInfo(sysInfo) {
        set({ sysInfo });
      },
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
      setManagerExist(managerExist) {
        set({ managerExist });
      },
      setExpanded(expanded) {
        set({ expanded });
      },
    }),
    {
      name: "configStore",
    }
  )
);
