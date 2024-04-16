import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  // 语言
  language: string;
  // comfyui路径
  comfyuiPath: string;
  theme: string;
  firstUse: boolean;
  // 国家
  country: string;
  // 侧边栏是否展开
  expanded: boolean;
  // 自动检测更新
  autoCheckUpdate: boolean;
};

type Action = {
  setLanguage: (language: string) => void;
  setFirstUse: (firstUse: boolean) => void;
  setComfyuiPath: (comfyuiPath: string) => void;
  setCountry: (country: string) => void;
  setExpanded: (expanded: boolean) => void;
  setAutoCheckUpdate: (autoCheckUpdate: boolean) => void;
};

export const useConfigStore = create(
  persist<State & Action>(
    (set) => ({
      language: "zh",
      theme: "light",
      comfyuiPath: "",
      firstUse: true,
      country: "chinese",
      expanded: true,
      autoCheckUpdate: false,
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
      setExpanded(expanded) {
        set({ expanded });
      },
      setAutoCheckUpdate(autoCheckUpdate) {
        set({ autoCheckUpdate });
      },
    }),
    {
      name: "configStore",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

type SessionStore = {
  loadData: boolean;
  setLoadData: (loadData: boolean) => void;
};

export const useSessionStore = create(
  persist<SessionStore>(
    (set) => ({
      loadData: false,
      setLoadData(loadData) {
        set({ loadData });
      },
    }),
    {
      name: "sessionStore",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
