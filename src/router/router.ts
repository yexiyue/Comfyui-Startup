import { createBrowserRouter } from "react-router-dom";
import { Component as Home } from "@/pages/Home";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: ErrorBoundary,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "plugin",
        lazy: () => import("@/pages/plugin/index"),
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
    path: "/first-use",
    lazy: () => import("@/pages/FirstUse"),
    ErrorBoundary: ErrorBoundary,
  },
]);
