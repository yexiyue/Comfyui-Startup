import { createBrowserRouter } from "react-router-dom";
import { Component as Home } from "@/pages/Home";
import { Layout } from "@/components/Layout";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "plugin",
        lazy: () => import("@/pages/Plugin"),
      },
      {
        path: "model",
        lazy: () => import("@/pages/Model"),
      },
      {
        path: "setting",
        lazy: () => import("@/pages/Setting"),
      },
    ],
  },
  {
    index: true,
    path: "/first-use",
    lazy: () => import("@/pages/FirstUse"),
  },
]);
