import { command } from "@/api";
import { useConfigStore } from "@/useStore";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Form, Input, Segmented, Select, Space, message } from "antd";
import { FolderClosedIcon } from "lucide-react";

export const Component = () => {
  useLingui();
  const [
    country,
    setCountry,
    comfyuiPath,
    setComfyuiPath,
    language,
    setLanguage,
  ] = useConfigStore((store) => [
    store.country,
    store.setCountry,
    store.comfyuiPath,
    store.setComfyuiPath,
    store.language,
    store.setLanguage,
  ]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Form
        className="w-[380px] translate-y-[-50px]"
        layout="vertical"
        labelCol={{ span: 4 }}
      >
        <Form.Item
          label={t`地区`}
          extra={t`在安装模型和插件时会根据不同地区自动配置代理`}
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

        <Form.Item label={t`路径`}>
          <Space.Compact>
            <Input
              value={comfyuiPath}
              className="cursor-pointer"
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
                  if (path) setComfyuiPath(path);
                } catch (error) {
                  message.error(`${error}`);
                }
              }}
            >
              <Trans>选择路径</Trans>
            </Button>
          </Space.Compact>
        </Form.Item>
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
        <div className="flex justify-center">
          <Button
            type="primary"
            className="w-full"
            onClick={async () => {
              await command("set_config", {
                configState: {
                  comfyui_path: comfyuiPath,
                  country,
                },
              });
            }}
          >
            <Trans>更新</Trans>
          </Button>
        </div>
      </Form>
    </div>
  );
};
