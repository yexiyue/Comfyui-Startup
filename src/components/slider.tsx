import { cn } from "@/lib/utils";
import { useConfigStore } from "@/useStore";
import { Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Space, Tooltip, theme } from "antd";
import {
  BlocksIcon,
  CirclePowerIcon,
  FileBoxIcon,
  IndentDecreaseIcon,
  SettingsIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";
import LogoIcon from "../assets/logo_icon.svg?react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export const Slider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = theme.useToken().token;

  const [expanded, setExpanded] = useConfigStore((store) => [
    store.expanded,
    store.setExpanded,
  ]);

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
    <div
      className="transition-all"
      style={{
        width: expanded ? 200 : 48,
      }}
    >
      <div className="w-full h-12 flex justify-center items-center relative">
        {expanded ? (
          <Logo className="h-full" />
        ) : (
          <LogoIcon
            onClick={() => setExpanded(!expanded)}
            className="h-6 cursor-pointer"
          />
        )}
        {expanded && (
          <div
            onClick={() => setExpanded(!expanded)}
            className="hover:bg-gray-100 cursor-pointer absolute right-2 rounded-sm p-1 group transition *:text-primaryThemeColor *:w-4 *:h-4  *:transition"
          >
            <IndentDecreaseIcon className="group-hover:text-secondaryThemeColor" />
          </div>
        )}
      </div>
      <Separator className="mb-2" />
      <div className="flex w-full flex-col px-2 gap-2">
        {menus.map((menu) => {
          const btn = (
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
                      paddingLeft: 8,
                    }
                  : {
                      paddingLeft: 8,
                    }
              }
              onClick={() => navigate(menu.to)}
            >
              <Space className="w-full text-nowrap">
                {menu.icon}
                {expanded && menu.title}
              </Space>
            </Button>
          );
          return expanded ? (
            btn
          ) : (
            <Tooltip key={menu.to} title={menu.title} placement="right">
              {btn}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
