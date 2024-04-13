import { command } from "@/api";
import { SkipModal } from "@/components/SkipModal";
import { useConfigStore } from "@/useStore";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect } from "ahooks";
import { App, Button, Card, Form, Input, Segmented, Select, Space } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

export const Component = () => {
  useLingui();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [
    country,
    language,
    comfyuiPath,
    setLanguage,
    setComfyuiPath,
    setCountry,
  ] = useConfigStore((store) => [
    store.country,
    store.language,
    store.comfyuiPath,
    store.setLanguage,
    store.setComfyuiPath,
    store.setCountry,
  ]);

  useAsyncEffect(async () => {
    try {
      const config = await command("get_config");
      if (config) {
        setCountry(config.country);
        setComfyuiPath(config.comfyui_path);
      }
    } catch (error) {
      message.error(`${error}`);
    }
  }, []);

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
              onClick={async () => {
                await command("set_config", {
                  configState: {
                    comfyui_path: comfyuiPath,
                    country,
                  },
                });
                await command("install_comfyui");
              }}
              type="primary"
            >
              <Trans>安装ComfyUI</Trans>
            </Button>
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
          setSkipModalOpen(false);
          navigate("/");
        }}
      />
    </div>
  );
};
