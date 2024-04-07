import { command } from "@/api";
import { notification } from "@/lib/notification";
import { useConfigStore } from "@/useStore";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Channel } from "@tauri-apps/api/core";
import { Modal, Button, Space, Typography, message, Progress } from "antd";
import { useState } from "react";

type ManagerModalProps = {
  managerExist: boolean;
};

export const ManagerModal = ({ managerExist }: ManagerModalProps) => {
  useLingui();
  const [downloading, setDownloading] = useState(false);
  const [setManagerExist] = useConfigStore((store) => [store.setManagerExist]);
  const [progress, setProgress] = useState(0);
  return (
    <Modal
      centered
      open={!managerExist}
      destroyOnClose
      closable={false}
      footer={[
        <div className="flex items-center gap-2 justify-end">
          <Progress
            size="small"
            style={{
              display: downloading ? "block" : "none",
            }}
            percent={progress}
          />
          <Button
            type="primary"
            loading={downloading}
            onClick={async () => {
              if (downloading) return;
              console.log("download");
              try {
                setDownloading(true);
                const onProgress = new Channel<{
                  message: number;
                  id: number;
                }>();
                onProgress.onmessage = (res) => {
                  setProgress(res.message);
                };

                await command("download_manager", { onProgress });
                message.success(t`ComfyUI-Manager 安装成功`);
                notification({
                  title: t`ComfyUI-Manager 安装成功`,
                  body: t`ComfyUI-Manager 安装成功，请重启ComfyUI`,
                });
                setManagerExist(true);
              } catch (error) {
                message.error(`${error}`);
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? <Trans>安装中</Trans> : <Trans>安装</Trans>}
          </Button>
        </div>,
      ]}
    >
      <div className="h-[120px]">
        <Space direction="vertical">
          <Typography.Text>
            <Trans>ComfyUI-Manager 未安装</Trans>
          </Typography.Text>
          <Typography.Text type="secondary">
            <Trans>
              为了不影响插件管理和模型管理功能的正常使用，请您安装ComfyUI-Manager插件，点击安装即可自动安装
            </Trans>
          </Typography.Text>
        </Space>
      </div>
    </Modal>
  );
};
