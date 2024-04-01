import { Channel, invoke } from "@tauri-apps/api/core";
import { message } from "antd";
import { PluginList, Plugin } from "./plugin";
import { t } from "@lingui/macro";
import { Model, ModelList } from "./model";

export const errorMap: any = {
  get_plugin_list: {
    "0": t`ComfyUI-Manager 未安装`,
  },
  download_plugin: {
    "0": t`插件安装失败`,
  },
  download_manager: {
    "0": t`ComfyUI Manager安装失败`,
  },
};

export const command = async <T extends keyof Commands>(
  cmd: T,
  args?: Parameters<Commands[T]>[0]
) => {
  try {
    return await invoke<ReturnType<Commands[T]>>(cmd, args);
  } catch (error: any) {
    if (errorMap?.[cmd]?.[error]) {
      message.error(errorMap[cmd][error]);
    } else {
      message.error(`${error}`);
    }
  }
};

type Commands = {
  // plugin
  manager_exists: () => boolean;
  download_manager: (args: { onProgress: Channel<[number, number]> }) => void;
  get_plugin_list: () => PluginList;
  download_plugin: (arg: {
    plugin: Plugin;
    onProgress: Channel<[number, number]>;
  }) => string;
  update_plugin: (args: {
    plugin: Plugin;
    onProgress: Channel<[number, number]>;
  }) => number;

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
    onProgress: Channel<[number, number]>;
  }) => number;
  cancel: (args: { taskId: number }) => void;
  restore: (args: {
    taskId: number;
    onProgress: Channel<[number, number]>;
  }) => void;
  get_model_list: () => ModelList;
};

export type SysInfo = {
  arch: string;
  cpu: string;
  os: string;
  os_version: string;
};

export type Config = { country: string; comfyui_path: string };
