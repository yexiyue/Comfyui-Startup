import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trans } from "@lingui/macro";
import { Space } from "antd";
import {
  BlocksIcon,
  CirclePowerIcon,
  FileBoxIcon,
  FileDownIcon,
  SettingsIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";
import { Separator } from "./ui/separator";
import { useLingui } from "@lingui/react";

export const Slider = () => {
  const navigate = useNavigate();
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
      title: <Trans>下载任务</Trans>,
      icon: <FileDownIcon className="w-4 h-4" />,
      to: "/download",
    },
    {
      title: <Trans>设置</Trans>,
      icon: <SettingsIcon className="w-4 h-4" />,
      to: "/setting",
    },
  ];

  return (
    <div className="w-full">
      <div className="w-full h-12">
        <Logo className="w-full" />
      </div>
      <Separator className="my-2" />
      <ToggleGroup className="flex w-full flex-col px-2" type="single">
        {menus.map((menu) => (
          <ToggleGroupItem
            className="w-full"
            key={menu.to}
            onClick={() => navigate(menu.to)}
            value={menu.to}
          >
            <Space className="w-full">
              {menu.icon}
              {menu.title}
            </Space>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
