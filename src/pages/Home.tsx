import { command } from "@/api";
import { useConfigStore } from "@/useStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "antd";
import { useEffect } from "react";
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
  useEffect(() => {
    // if (firstUse) {
    //   navigate("/first-use");
    //   setFirstUse(false);
    // }
  }, []);

  // 设置系统状态
  useEffect(() => {
    invoke("set_config", {
      configState: {
        comfyui_path: comfyuiPath,
        country,
      },
    });
  }, [comfyuiPath, country]);

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
    </div>
  );
};
