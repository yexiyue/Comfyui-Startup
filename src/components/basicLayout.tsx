import { command } from "@/api";
import { useConfigHydration } from "@/hooks/useHydration";
import { useModelDownloadStore } from "@/pages/model/useStore";
import { useConfigStore } from "@/useStore";
import { LoadingOutlined } from "@ant-design/icons";
import { t } from "@lingui/macro";
import { getCurrent } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect } from "ahooks";
import { Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
// import { check } from "@tauri-apps/plugin-updater";
// import { relaunch } from "@tauri-apps/plugin-process";

export const BasicLayout = () => {
  const navigate = useNavigate();
  const [finished, setFinished] = useState(false);
  const _hasHydrated = useConfigHydration();
  // useAsyncEffect(async () => {
  //   const res = await check();
  //   console.log(res);
  // }, []);
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

  useAsyncEffect(async () => {
    if (_hasHydrated) {
      const firstUse = useConfigStore.getState().firstUse;
      const comfyuiExist = await command("comfyui_exists", {
        path: useConfigStore.getState().comfyuiPath,
      });

      if (firstUse || !comfyuiExist) {
        navigate("/first-use");
      }
      setTimeout(() => {
        setFinished(true);
      }, 1000);
    }
  }, [_hasHydrated]);

  return (
    <>
      {!finished ? (
        <div className="w-screen h-screen flex justify-center items-center">
          <div className="flex flex-col gap-2 bg-transparent fixed">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
            <Typography.Link
              style={{
                cursor: "default",
              }}
            >{t`初始化中...`}</Typography.Link>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};
