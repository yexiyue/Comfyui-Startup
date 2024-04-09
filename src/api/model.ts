import { Channel } from "@tauri-apps/api/core";
import { Pagination } from "./plugin";

export type Model = {
  id: number;
  name: string;
  type: string;
  base: string;
  save_path: string;
  description: string;
  reference: string;
  filename: string;
  url: string;
} & Extra;

type Extra = {
  status: ModelStatus;
  progress: [number, number] | null;
  speed: number | null;
  taskId?: number;
};

export type ModelStatus =
  | "pending"
  | "running"
  | "paused"
  | "success"
  | "failed";

export type ModelOnProgress = Channel<{
  message: {
    status: ModelStatus;
    progress: [number, number] | null;
    speed: number | null;
    error_message: string | null;
  };
  id: number;
}>;

export type ModelApi = {
  get_model_type_groups: () => { value: string }[];
  get_model_base_groups: () => { value: string }[];
  download: (args: { model: Model; onProgress: ModelOnProgress }) => number;
  restore: (args: { taskId: number; onProgress: ModelOnProgress }) => void;
  cancel: (args: { taskId: number }) => void;
  remove: (args: { url: string }) => void;
  get_model_list: (args: {
    search: string;
    pagination?: Pagination;
    ty?: string;
    base?: string;
  }) => [Model[], number];
};
