import { invoke } from "@tauri-apps/api/core";

export async function info(str: string) {
  await invoke("plugin:tracing|info", { str });
}

export async function trace(str: string) {
  await invoke("plugin:tracing|trace", { str });
}
export async function warn(str: string) {
  await invoke("plugin:tracing|warn", { str });
}
export async function error(str: string) {
  await invoke("plugin:tracing|error", { str });
}
