import { createBrowserRouter } from "react-router-dom";
import { Component as Home } from "@/pages/home";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/errorBoundary";
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
    ErrorBoundary: ErrorBoundary,
  },
]);
