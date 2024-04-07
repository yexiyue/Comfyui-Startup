import { Channel } from "@tauri-apps/api/core";

export type Model = {
  name: string;
  type: string;
  base: string;
  save_path: string;
  description: string;
  reference: string;
  filename: string;
  url: string;
};

type ModelStatus = "pending" | "running" | "paused" | "success" | "failed";

export type ModelList = {
  models: Model[];
};

export type ModelApi = {
  get_model_type_groups: () => any;
  get_model_base_groups: () => any;
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
};
