import { Channel, invoke } from "@tauri-apps/api/core";
import { ModelApi } from "./model";
import { PluginApi } from "./plugin";

export const command = async <T extends keyof Commands>(
  cmd: T,
  args?: Parameters<Commands[T]>[0]
) => {
  return await invoke<ReturnType<Commands[T]>>(cmd, args);
};

type Commands = {
  // ComfyUI Manager
  manager_exists: () => boolean;
  download_manager: (args: {
    onProgress: Channel<{ message: number; id: number }>;
  }) => void;

  // config
  get_info: () => SysInfo;
  get_config: () => Config;
  set_config: (args: { configState: Config }) => void;
  // comfyui
  install_comfyui: () => void;
  startup: () => void;
  // 初始化数据
  init_data: () => void;
} & PluginApi &
  ModelApi;

export type SysInfo = {
  arch: string;
  cpu: string;
  os: string;
  os_version: string;
};

export type Config = { country: string; comfyui_path: string };
