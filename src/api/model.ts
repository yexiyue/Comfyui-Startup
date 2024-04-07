import { Channel } from "@tauri-apps/api/core";
import { Pagination } from "./plugin";

export type Model = {
  name: string;
  type: string;
  base: string;
  save_path: string;
  description: string;
  reference: string;
  filename: string;
  url: string;
} & Extra;

type Extra = { progress?: number; status?: ModelStatus };

export type ModelStatus =
  | "pending"
  | "running"
  | "paused"
  | "success"
  | "failed";

export type ModelApi = {
  get_model_type_groups: () => { value: string }[];
  get_model_base_groups: () => { value: string }[];
  download: (args: {
    model: Model;
    onProgress: Channel<{ message: [number, number]; id: number }>;
  }) => number;
  cancel: (args: { taskId: number }) => void;
  restore: (args: {
    taskId: number;
    onProgress: Channel<{ message: [number, number]; id: number }>;
  }) => void;
  get_model_list: (args: {
    search: string;
    pagination?: Pagination;
    ty?: string;
    base?: string;
  }) => [Model[], number];
};
