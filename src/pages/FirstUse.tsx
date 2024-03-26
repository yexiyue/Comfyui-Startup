import { useState } from "react";
import { Trans } from "@lingui/macro";
import { useConfigStore } from "@/useStore";
import { open } from "@tauri-apps/plugin-dialog";
import { info, error } from "tauri-plugin-tracing-api";
import { Button, Input, Select, Space } from "antd";
import { FolderClosedIcon } from "lucide-react";
import { Command } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";

export const Component = () => {
  const [step, setStep] = useState(0);
  const [language, comfyuiPath, setLanguage, setComfyuiPath] = useConfigStore(
    (store) => [
      store.language,
      store.comfyuiPath,
      store.setLanguage,
      store.setComfyuiPath,
    ]
  );
  return (
    <div className="flex items-center h-screen justify-center flex-col">
      <div
        className={`${
          step !== 0 ? "hidden" : "block"
        } w-full h-[250px] flex flex-col items-center gap-4`}
      >
        <p className=" text-xl">Comfyui Startup</p>
        <Select
          className="w-[150px]"
          value={language}
          onChange={(value) => setLanguage(value)}
          options={[
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
          ]}
        ></Select>
      </div>
      <div
        className={`${
          step !== 1 ? "hidden" : "block"
        } w-full h-[250px] flex flex-col items-center gap-4`}
      >
        <Button
          onClick={async () => {
            try {
              const command = await invoke("install_comfyui");
              console.log(command);
            } catch (error) {
              console.log(error);
            }
          }}
        >
          安装Brew
        </Button>
        <Input
          // value={comfyuiPath}
          // className="w-[200px]"
          // onClick={async () => {
          //   const path = await open({
          //     directory: true,
          //   });
          //   info(`${path}`);
          //   if (path) {
          //     setComfyuiPath(path);
          //   }
          // }}
          prefix={<FolderClosedIcon />}
        ></Input>
      </div>
      <div
        className={`${
          step !== 2 ? "hidden" : "block"
        } w-full h-[250px] flex flex-col items-center gap-4`}
      >
        <p className=" text-xl">Comfyui Startup2</p>
      </div>
      <Space>
        {step !== 0 && (
          <Button type="primary" onClick={() => setStep(step - 1)}>
            <Trans>上一步</Trans>
          </Button>
        )}
        {step !== 2 ? (
          <Button type="primary" onClick={() => setStep(step + 1)}>
            <Trans>下一步</Trans>
          </Button>
        ) : (
          <Button type="primary">
            <Trans>完成</Trans>
          </Button>
        )}
      </Space>
    </div>
  );
};
