import { SysInfo, command } from "@/api";
import homebg from "@/assets/home.png";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useConfigStore, useSessionStore } from "@/useStore";
import {
  AppleOutlined,
  LoadingOutlined,
  WindowsOutlined,
} from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useAsyncEffect } from "ahooks";
import { App, Button, Spin, Typography } from "antd";
import { CpuIcon } from "lucide-react";
import { useState } from "react";

export const Component = () => {
  const { message } = App.useApp();
  const [sysInfo, setSysInfo] = useState<SysInfo | null>();

  useAsyncEffect(async () => {
    const sysInfo = await command("get_info");
    if (sysInfo) {
      setSysInfo(sysInfo);
    }
  }, []);

  const [comfyuiPath, country] = useConfigStore((store) => [
    store.comfyuiPath,
    store.country,
  ]);

  const [loadData, setLoadData] = useSessionStore((store) => [
    store.loadData,
    store.setLoadData,
  ]);

  const [dataLoading, setDataLoading] = useState(false);

  // 设置系统状态
  useAsyncEffect(async () => {
    await command("set_config", {
      configState: {
        comfyui_path: comfyuiPath,
        country,
      },
    });
  }, [comfyuiPath, country]);

  useAsyncEffect(async () => {
    if (!loadData) {
      try {
        setDataLoading(true);
        await command("init_data");
        setLoadData(true);
      } catch (error) {
        console.log(error);
        message.error(t`加载数据失败，请检查网络`);
      } finally {
        setDataLoading(false);
      }
    }
  }, [loadData]);

  return (
    <div className=" h-screen">
      {dataLoading && (
        <div className="w-full h-full flex justify-center items-center">
          <div className="flex flex-col gap-2 bg-transparent fixed">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
            <Typography.Link
              style={{
                cursor: "default",
              }}
            >{t`数据加载中...`}</Typography.Link>
          </div>
        </div>
      )}
      <AspectRatio ratio={2}>
        <img src={homebg} className="object-cover" />
      </AspectRatio>
      <div className=" p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CpuIcon />
          <Typography.Text>{sysInfo?.cpu}</Typography.Text>
        </div>
        <div className="flex items-center gap-2">
          <p className=" text-2xl">
            {sysInfo?.os === "macos" ? <AppleOutlined /> : <WindowsOutlined />}
          </p>
          <Typography.Text>{sysInfo?.os_version}</Typography.Text>
        </div>
      </div>
      <div className="w-full flex justify-center items-center">
        <Button
          type="primary"
          style={{
            width: 200,
          }}
          onClick={async () => {
            try {
              await command("startup");
            } catch (error) {
              message.error(t`启动失败`);
            }
          }}
        >
          <Trans>启动</Trans>
        </Button>
      </div>
    </div>
  );
};
