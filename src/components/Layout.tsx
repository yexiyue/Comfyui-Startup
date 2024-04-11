import { command } from "@/api";
import { useModelDownloadStore } from "@/pages/Model/useStore";
import { t } from "@lingui/macro";
import { getCurrent } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Slider } from "./Slider";
import { Separator } from "./ui/separator";

export const Layout = () => {
  // 全局只注册一次的关闭提示
  useEffect(() => {
    const window = getCurrent();
    window.onCloseRequested(async (e) => {
      const downloadingModels = Object.values(
        useModelDownloadStore.getState().downloadingModels
      );
      const isDownloadingModels = downloadingModels.filter(
        (item) => item.status === "running" || item.status === "pending"
      );
      if (isDownloadingModels.length > 0) {
        const res = await confirm(
          t`当前有${isDownloadingModels.length}个模型正在下载，确定要关闭吗？`,
          { kind: "info", title: t`提示` }
        );

        if (res) {
          const cancels = isDownloadingModels.map((item) =>
            command("cancel", { taskId: item.taskId! })
          );
          await Promise.allSettled(cancels);
        } else {
          e.preventDefault();
        }
      }
    });
  }, []);
  return (
    <div className="w-screen h-screen flex">
      <Slider />
      <Separator orientation="vertical" className="h-full" />
      <div className="overflow-hidden flex-1">
        <Outlet />
      </div>
    </div>
  );
};
