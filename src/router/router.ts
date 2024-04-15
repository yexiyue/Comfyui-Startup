import { createBrowserRouter } from "react-router-dom";
import { SliderLayout } from "@/components/sliderLayout";
import { ErrorBoundary } from "@/components/errorBoundary";
import { BasicLayout } from "@/components/basicLayout";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: BasicLayout,
    ErrorBoundary: ErrorBoundary,
    children: [
      {
        path: "/",
        Component: SliderLayout,
        children: [
          {
            index: true,
            lazy: () => import("@/pages/home"),
          },
          {
            path: "plugin",
            lazy: () => import("@/pages/plugin"),
          },
          {
            path: "model",
            lazy: () => import("@/pages/model"),
          },
          {
            path: "setting",
            lazy: () => import("@/pages/setting"),
          },
        ],
      },
      {
        path: "/first-use",
        lazy: () => import("@/pages/firstUse"),
      },
    ],
  },
]);
