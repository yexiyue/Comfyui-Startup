import { useConfigStore } from "@/useStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
    if (firstUse) {
      navigate("/first-use");
      setFirstUse(false);
    }
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
    </div>
  );
};
