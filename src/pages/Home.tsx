import { command } from "@/api";
import { ManagerModal } from "@/components/Home/ManagerModal";
import { useConfigStore } from "@/useStore";
import { useAsyncEffect } from "ahooks";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Component = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [
    managerExist,
    firstUse,
    comfyuiPath,
    country,
    setFirstUse,
    setManagerExist,
  ] = useConfigStore((store) => [
    store.managerExist,
    store.firstUse,
    store.comfyuiPath,
    store.country,
    store.setFirstUse,
    store.setManagerExist,
  ]);

  useEffect(() => {
    if (firstUse) {
      navigate("/first-use");
      setFirstUse(false);
    }
  }, []);

  // 设置系统状态
  useAsyncEffect(async () => {
    setLoading(true);
    await command("set_config", {
      configState: {
        comfyui_path: comfyuiPath,
        country,
      },
    });

    let res = await command("manager_exists");
    setManagerExist(res);
    setLoading(false);
  }, [comfyuiPath, country]);

  useAsyncEffect(async () => {
    try {
      await command("init_data");
    } catch (error) {
      message.error(`${error}`);
    }
  }, []);

  return (
    <div className=" h-screen">
      <p>首页</p>
      <Button
        onClick={async () => {
          await command("startup");
        }}
      >
        启动
      </Button>
      {!loading && <ManagerModal managerExist={managerExist} />}
    </div>
  );
};
