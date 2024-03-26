import { createBrowserRouter } from "react-router-dom";
import { Component as Home } from "@/pages/Home";
export const router = createBrowserRouter([
  {
    index: true,
    path: "/",
    Component: Home,
  },
  {
    index: true,
    path: "/first-use",
    lazy: () => import("@/pages/FirstUse"),
  },
]);
