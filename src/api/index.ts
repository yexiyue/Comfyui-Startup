import { Channel, invoke } from "@tauri-apps/api/core";
import { Model, ModelList } from "./model";
import { Plugin, PluginApi } from "./plugin";

export const command = async <T extends keyof Commands>(
  cmd: T,
  args?: Parameters<Commands[T]>[0]
) => {
  return await invoke<ReturnType<Commands[T]>>(cmd, args);
};

type Commands = {
  // plugin
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

  // model
  download: (args: {
    model: Model;
    onProgress: Channel<{ message: [number, number]; id: number }>;
  }) => number;
  cancel: (args: { taskId: number }) => void;
  restore: (args: {
    taskId: number;
    onProgress: Channel<{ message: [number, number]; id: number }>;
  }) => void;
  get_model_list: () => ModelList;
  remove_plugin: (args: { plugin: Plugin }) => void;
  init_data: () => void;
  get_model_type_groups: () => any;
  get_model_base_groups: () => any;
} & PluginApi;

export type SysInfo = {
  arch: string;
  cpu: string;
  os: string;
  os_version: string;
};

export type Config = { country: string; comfyui_path: string };
