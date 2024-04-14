import { invoke } from "@tauri-apps/api/core";
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
  comfyui_exists: (args: { path: string }) => boolean;

  // config
  get_info: () => SysInfo;
  get_config: () => Config;
  set_config: (args: { configState: Config }) => void;
  // comfyui
  install_comfyui: () => void;
  startup: () => void;
  // 初始化数据
  init_data: () => void;
  // json db
  get_item: (args: { key: string }) => any;
  set_item: (args: { key: string; value: string }) => void;
  remove_item: (args: { key: string }) => void;
  save: () => void;
} & PluginApi &
  ModelApi;

export type SysInfo = {
  arch: string;
  cpu: string;
  os: string;
  os_version: string;
};

export type Config = { country: string; comfyui_path: string };
