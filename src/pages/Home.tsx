import { useConfigStore } from "@/useStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export const Component = () => {
  const navigate = useNavigate();
  const [firstUse, setFirstUse] = useConfigStore((store) => [
    store.firstUse,
    store.setFirstUse,
  ]);
  useEffect(() => {
    if (firstUse) {
      navigate("/first-use");
      setFirstUse(false);
    }
    navigate("/first-use");
  }, []);
  return (
    <div className=" h-screen">
      <p>首页</p>
    </div>
  );
};
