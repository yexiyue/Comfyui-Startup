import { cn } from "@/lib/utils";
import { Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Space, theme } from "antd";
import {
  BlocksIcon,
  CirclePowerIcon,
  FileBoxIcon,
  SettingsIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export const Slider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = theme.useToken().token;
  // const [expanded, setExpanded] = useConfigStore((store) => [
  //   store.expanded,
  //   store.setExpanded,
  // ]);
  useLingui();

  const menus: {
    title: ReactNode;
    icon: ReactNode;
    to: string;
  }[] = [
    {
      title: <Trans>启动</Trans>,
      icon: <CirclePowerIcon className="w-4 h-4" />,
      to: "/",
    },
    {
      title: <Trans>插件管理</Trans>,
      icon: <BlocksIcon className="w-4 h-4" />,
      to: "/plugin",
    },
    {
      title: <Trans>模型管理</Trans>,
      icon: <FileBoxIcon className="w-4 h-4" />,
      to: "/model",
    },
    {
      title: <Trans>设置</Trans>,
      icon: <SettingsIcon className="w-4 h-4" />,
      to: "/setting",
    },
  ];

  return (
    <div className="w-[200px]">
      <div className="w-full h-12 flex justify-center items-center">
        <Logo className="h-full" />
      </div>
      <Separator className="mb-2" />
      <div className="flex w-full flex-col px-2 gap-2">
        {menus.map((menu) => (
          <Button
            variant="ghost"
            key={menu.to}
            className={cn(
              location.pathname === menu.to ? "" : " hover:bg-gray-100"
            )}
            style={
              location.pathname === menu.to
                ? {
                    backgroundColor: token.colorPrimary,
                    color: token.colorTextLightSolid,
                  }
                : {}
            }
            onClick={() => navigate(menu.to)}
          >
            <Space className="w-full text-nowrap">
              {menu.icon}
              {menu.title}
            </Space>
          </Button>
        ))}
      </div>
    </div>
  );
};
