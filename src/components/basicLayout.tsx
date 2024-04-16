import { command } from "@/api";
import { useConfigHydration } from "@/hooks/useHydration";
import { useUpdater } from "@/hooks/useUpdater";
import { useModelDownloadStore } from "@/pages/model/useStore";
import { useConfigStore } from "@/useStore";
import { LoadingOutlined } from "@ant-design/icons";
import { t } from "@lingui/macro";
import { getCurrent } from "@tauri-apps/api/window";
import { ask, confirm } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect } from "ahooks";
import { App, Modal, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export const BasicLayout = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [finished, setFinished] = useState(false);
  const _hasHydrated = useConfigHydration();
  const { updating, update, checkUpdate } = useUpdater({
    manual: true,
    timeout: 3000,
  });

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
      const { firstUse, autoCheckUpdate } = useConfigStore.getState();
      const comfyuiExist = await command("comfyui_exists", {
        path: useConfigStore.getState().comfyuiPath,
      });

      if (autoCheckUpdate) {
        try {
          const shouldUpdate = await checkUpdate();
          if (shouldUpdate) {
            const confirm = await ask(t`发现新版本，是否更新？`, {
              title: t`更新提示`,
              kind: "info",
              okLabel: t`更新`,
              cancelLabel: t`取消`,
            });
            if (confirm) {
              await update();
            }
          }
        } catch (error) {
          message.error(t`检查更新失败`);
        }
      }

      if (firstUse || !comfyuiExist) {
        navigate("/first-use");
      }
      setTimeout(() => {
        setFinished(true);
      }, 1500);
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
      <Modal
        centered
        open={updating}
        closable={false}
        footer={null}
        width={200}
        styles={{
          body: {
            height: 120,
          },
        }}
      >
        <div className="w-full h-full flex justify-center items-center flex-col">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
          <Typography.Link
            style={{
              cursor: "default",
            }}
          >{t`正在更新...`}</Typography.Link>
        </div>
      </Modal>
    </>
  );
};
