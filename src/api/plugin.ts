import { Channel } from "@tauri-apps/api/core";

export type Plugin = {
  id: number;
  author: string;
  description: string;
  files: string[];
  install_type: string;
  pip?: string[];
  reference: string;
  title: string;
};

type Pagination = {
  page: number;
  page_size: number;
};

type PluginStatus =
  | "Success"
  | "Error"
  | "Pending"
  | "Downloading"
  | "Updating"
  | "Canceled";

export type PluginOnProgress = Channel<{
  message: {
    error_message: string | null;
    progress: number | null;
    status: PluginStatus;
  };
  id: number;
}>;

export type PluginApi = {
  get_plugin_list: (args: {
    search: string;
    pagination?: Pagination;
  }) => [Plugin[], number];
  download_plugin: (arg: {
    plugin: Plugin;
    onProgress: PluginOnProgress;
  }) => void;
  update_plugin: (args: {
    plugin: Plugin;
    onProgress: Channel<{
      message: number;
      id: number;
    }>;
  }) => number;
  get_installed_plugins: () => [string, Plugin | null][];
  cancel_plugin: (args: { plugin: Plugin }) => void;
};
