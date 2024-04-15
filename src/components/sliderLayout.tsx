import { Outlet } from "react-router-dom";
import { Slider } from "./slider";
import { Separator } from "./ui/separator";

export const SliderLayout = () => {
  return (
    <div className="w-screen h-screen flex">
      <Slider />
      <Separator orientation="vertical" className="h-full" />
      <div className="overflow-hidden flex-1">
        <Outlet />
      </div>
    </div>
  );
};
