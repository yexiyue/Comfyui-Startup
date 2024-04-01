import { Trans, t } from "@lingui/macro";
import { useConfigStore } from "@/useStore";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Button,
  Input,
  Segmented,
  Select,
  App,
  Form,
  Card,
  Space,
  Typography,
} from "antd";
import { FolderClosedIcon } from "lucide-react";
import Logo from "../assets/logo.svg?react";
import { useAsyncEffect } from "ahooks";
import { command } from "@/api";

export const Component = () => {
  const { message } = App.useApp();

  const [
    country,
    language,
    comfyuiPath,
    sysInfo,
    setLanguage,
    setComfyuiPath,
    setCountry,
    setSysInfo,
  ] = useConfigStore((store) => [
    store.country,
    store.language,
    store.comfyuiPath,
    store.sysInfo,
    store.setLanguage,
    store.setComfyuiPath,
    store.setCountry,
    store.setSysInfo,
  ]);

  useAsyncEffect(async () => {
    try {
      const config = await command("get_config");
      const info = await command("get_info");
      setSysInfo(info);
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
        <div>
          <Logo className="w-[300px] h-[150px]" />
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
                className="cursor-pointer"
                disabled
                placeholder={t`请选择安装目录`}
                prefix={<FolderClosedIcon className="h-4 w-4" />}
              />
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    const path = await open({
                      directory: true,
                    });
                    if (path) setComfyuiPath(`${path}/ComfyUI`);
                  } catch (error) {
                    message.error(`${error}`);
                  }
                }}
              >
                <Trans>选择路径</Trans>
              </Button>
            </Space.Compact>
          </Form.Item>

          <div className="w-full flex justify-center">
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
              <Trans>安装Comfyui</Trans>
            </Button>
          </div>
        </Form>
        <div className="w-full flex justify-center mt-3">
          <Typography.Text type="secondary" className="text-xs">
            {sysInfo?.os_version} {sysInfo?.cpu}
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
};
