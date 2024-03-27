import { useState } from "react";
import { Trans, t } from "@lingui/macro";
import { useConfigStore } from "@/useStore";
import { open } from "@tauri-apps/plugin-dialog";
import { info } from "tauri-plugin-tracing-api";
import { Button, Input, Segmented, Select, Space, App, Form, Card } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export const Component = () => {
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
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
  return (
    <div className="flex items-center h-screen justify-center flex-col">
      <Card className="shadow-sm w-[350px]">
        <p className="text-xl">Comfyui Startup</p>
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
            <Input
              value={comfyuiPath}
              className="cursor-pointer"
              onChange={(e) => {
                setComfyuiPath(e.currentTarget.value);
              }}
              placeholder={t`请选择或输入安装路径`}
              prefix={
                <FolderClosedIcon
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
                />
              }
            />
          </Form.Item>

          <div className="w-full flex justify-center">
            <Button onClick={async () => {}} type="primary">
              <Trans>安装Comfyui</Trans>
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
