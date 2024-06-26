import { SysInfo, command } from "@/api";
import { SkipModal } from "@/components/skipModal";
import { useConfigStore } from "@/useStore";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { getCurrent } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect } from "ahooks";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Typography,
} from "antd";
import { FolderClosedIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

const tauriWindow = getCurrent();

export const Component = () => {
  useLingui();
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [sysInfo, setSysInfo] = useState<SysInfo | null>();

  useAsyncEffect(async () => {
    const sysInfo = await command("get_info");
    if (sysInfo) {
      setSysInfo(sysInfo);
    }
  }, []);

  const [
    country,
    language,
    comfyuiPath,
    setLanguage,
    setComfyuiPath,
    setCountry,
    setFirstUse,
  ] = useConfigStore((store) => [
    store.country,
    store.language,
    store.comfyuiPath,
    store.setLanguage,
    store.setComfyuiPath,
    store.setCountry,
    store.setFirstUse,
  ]);

  return (
    <div className="flex items-center h-screen justify-center flex-col">
      <Card className="shadow-sm w-[350px]">
        <div className=" h-[90px] flex justify-center">
          <Logo />
        </div>
        <Form layout="vertical">
          <Form.Item label={t`语言`}>
            <Select
              className="w-[150px]"
              value={language}
              onChange={(value) => setLanguage(value)}
              options={[
                { value: "en", label: "English" },
                { value: "zh", label: "中文" },
                { value: "ja", label: "日本語" },
              ]}
            ></Select>
          </Form.Item>
          <Form.Item
            label={t`地区`}
            extra={t`在安装comfyui时会根据不同地区自动配置代理`}
          >
            <Segmented
              value={country}
              options={[
                {
                  label: t`中国用户`,
                  value: "chinese",
                },
                {
                  label: t`其他国家`,
                  value: "foreign",
                },
              ]}
              onChange={setCountry}
            />
          </Form.Item>

          <Form.Item label={t`路径`} required>
            <Space.Compact>
              <Input
                value={comfyuiPath}
                onChange={(e) => setComfyuiPath(e.target.value)}
                className="cursor-pointer"
                placeholder={t`请选择或输入安装目录`}
                prefix={<FolderClosedIcon className="h-4 w-4" />}
              />
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    const path = await open({
                      directory: true,
                    });
                    if (path) setComfyuiPath(path);
                  } catch (error) {
                    message.error(`${error}`);
                  }
                }}
              >
                <Trans>选择目录</Trans>
              </Button>
            </Space.Compact>
          </Form.Item>

          <div className="w-full flex flex-col justify-center gap-4">
            <Button
              disabled={!comfyuiPath || sysInfo?.os !== "macos"}
              onClick={async () => {
                await command("set_config", {
                  configState: {
                    comfyui_path: comfyuiPath,
                    country,
                  },
                });
                setFirstUse(false);
                await command("install_comfyui");
                setComfyuiPath(`${comfyuiPath}/ComfyUI`);
                notification.success({
                  message: t`即将自动关闭`,
                  description: t`正在执行ComfyUI安装脚本，待安装完成后会自动为您重新打开`,
                  onClose: () => {
                    tauriWindow.close();
                  },
                  duration: 3,
                });
              }}
              type="primary"
            >
              <Trans>安装ComfyUI</Trans>
            </Button>
            {sysInfo?.os !== "macos" && (
              <Typography.Text type="secondary">
                <Trans>
                  目前只支持macos系统一键安装ComfyUI,如果是windows用户请手动安装
                </Trans>
              </Typography.Text>
            )}
            <Button
              onClick={() => {
                setSkipModalOpen(true);
              }}
              type="link"
            >
              <Trans>跳过安装</Trans>
            </Button>
          </div>
        </Form>
      </Card>
      <SkipModal
        skipModalOpen={skipModalOpen}
        setSkipModalOpen={setSkipModalOpen}
        onOk={(value) => {
          setComfyuiPath(value);
          setFirstUse(false);
          setSkipModalOpen(false);
          navigate("/");
        }}
      />
    </div>
  );
};
