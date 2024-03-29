import { useState } from "react";
import { Trans, t } from "@lingui/macro";
import { useConfigStore } from "@/useStore";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Input, Segmented, Select, Space, App, Form, Card } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { Channel, invoke } from "@tauri-apps/api/core";

export const Component = () => {
  const { message } = App.useApp();
  const [taskId, setTaskId] = useState(0);

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
            <Button
              onClick={async () => {
                try {
                  const channel = new Channel();
                  channel.onmessage = (event) => {
                    console.log(event);
                  };
                  let taskId = await invoke<number>("download", { channel });
                  // console.log(taskId);
                  // setTimeout(async () => {
                  //   try {
                  //     let res = await invoke<string>("cancel", { taskId });
                  //     console.log(res);
                  //   } catch (error) {
                  //     console.log(error);
                  //   }
                  // }, 100000);
                  setTaskId(taskId);
                } catch (error) {
                  console.log(error);
                }
              }}
              type="primary"
            >
              <Trans>安装Comfyui</Trans>
            </Button>
            <Button
              onClick={async () => {
                try {
                  let res = await invoke<string>("cancel", { taskId });
                  console.log(res);
                } catch (error) {
                  console.log(error);
                }
              }}
              type="primary"
            >
              <Trans>cancel</Trans>
            </Button>
            <Button
              onClick={async () => {
                try {
                  const channel = new Channel();
                  channel.onmessage = (event) => {
                    console.log("restore:", event);
                  };
                  let res = await invoke<string>("restore", {
                    taskId: 23,
                    channel,
                  });
                  console.log(res);
                } catch (error) {
                  console.log(error);
                }
              }}
              type="primary"
            >
              <Trans>restore</Trans>
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
