import { command } from "@/api";
import { Trans, t } from "@lingui/macro";
import { open } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect, useControllableValue } from "ahooks";
import { Button, Input, Modal, Typography, message } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { useState } from "react";

type SkipModalProps = {
  value?: string;
  onChange?: (value: string) => void;
  skipModalOpen: boolean;
  setSkipModalOpen: (open: boolean) => void;
  onOk: (value: string) => void;
};

export const SkipModal = (props: SkipModalProps) => {
  const { skipModalOpen, setSkipModalOpen } = props;
  const [value, setValue] = useControllableValue<string>(props);
  const [isTrue, setIsTrue] = useState<boolean | undefined>();
  const [tooltip, setTooltip] = useState<string | undefined>();

  useAsyncEffect(async () => {
    if (!value) {
      return setTooltip(t`路径不能为空`);
    }
    const exist = await command("comfyui_exists", { path: value });
    if (!exist) {
      setIsTrue(false);
      return setTooltip(t`请选择或输入正确的ComfyUI目录`);
    } else {
      setIsTrue(true);
    }
  }, [value]);

  return (
    <Modal
      open={skipModalOpen}
      width={400}
      centered
      destroyOnClose
      onOk={() => props.onOk(value)}
      onCancel={() => setSkipModalOpen(false)}
      title={<Trans>ComfyUI目录</Trans>}
      okButtonProps={{ disabled: !isTrue }}
    >
      <div className="w-full flex flex-col">
        <Typography.Text type="secondary">
          <Trans>下载插件和模型需要ComfyUI目录</Trans>
        </Typography.Text>
        <Input
          value={value}
          style={{
            marginTop: 24,
            marginBottom: 12,
          }}
          status={isTrue === false ? "error" : ""}
          onChange={(e) => setValue(e.target.value)}
          className="cursor-pointer"
          placeholder={t`请选择或输入ComfyUI目录`}
          prefix={<FolderClosedIcon className="h-4 w-4" />}
        />
        <Button
          type="primary"
          onClick={async () => {
            try {
              const path = await open({
                directory: true,
              });
              if (path) setValue(path);
            } catch (error) {
              message.error(`${error}`);
            }
          }}
        >
          <Trans>选择路径</Trans>
        </Button>
        {isTrue === false && (
          <Typography.Text type="danger">{tooltip}</Typography.Text>
        )}
      </div>
    </Modal>
  );
};
