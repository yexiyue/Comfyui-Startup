import { Outlet } from "react-router-dom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./ui/resizable";
import { Slider } from "./Slider";

export const Layout = () => {
  return (
    <div className="w-screen h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          collapsedSize={5}
          defaultSize={20}
          minSize={15}
          maxSize={25}
          collapsible
        >
          <Slider />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <Outlet></Outlet>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
