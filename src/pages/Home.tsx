import { command } from "@/api";
import { useConfigStore, useSessionStore } from "@/useStore";
import { LoadingOutlined } from "@ant-design/icons";
import { t } from "@lingui/macro";
import { useAsyncEffect } from "ahooks";
import { Button, Spin, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Component = () => {
  const navigate = useNavigate();

  const [firstUse, comfyuiPath, country, setFirstUse] = useConfigStore(
    (store) => [
      store.firstUse,
      store.comfyuiPath,
      store.country,
      store.setFirstUse,
    ]
  );

  const [loadData, setLoadData] = useSessionStore((store) => [
    store.loadData,
    store.setLoadData,
  ]);

  const [dataLoading, setDataLoading] = useState(false);
  useEffect(() => {
    if (firstUse) {
      navigate("/first-use");
      setFirstUse(false);
    }
    // navigate("/first-use");
  }, []);
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
      <p>首页</p>
      <Button
        onClick={async () => {
          await command("startup");
        }}
      >
        启动
      </Button>
    </div>
  );
};
