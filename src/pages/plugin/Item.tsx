import { command } from "@/api";
import { Plugin } from "@/api/plugin";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import { GithubOutlined } from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { Channel } from "@tauri-apps/api/core";
import { Progress, Space, Button, message } from "antd";
import { Button as UIButton } from "@/components/ui/button";
import { ArrowBigDownDashIcon, ArrowBigUpDash, Trash2Icon } from "lucide-react";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePluginStore } from "./useStore";

type PluginItemProps = {
  plugin: Plugin;
  isDownloaded: boolean;
};

export const PluginItem = ({ plugin, isDownloaded }: PluginItemProps) => {
  useLingui();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addPlugin, removePlugin] = usePluginStore((store) => [
    store.addPlugin,
    store.removePlugin,
  ]);

  return (
    <Card className="relative">
      {isDownloaded ? (
        <Space className=" absolute top-4 right-4 ">
          <UIButton
            size="sm"
            variant="destructive"
            className="h-6"
            onClick={async () => {
              try {
                await command("remove_plugin", { plugin });
                removePlugin(plugin);
                message.success(t`${plugin.title}卸载成功`);
              } catch (error) {
                console.log(error);
              }
            }}
          >
            <Space size={4}>
              <Trash2Icon className="w-4 h-4" />
              <Trans>卸载</Trans>
            </Space>
          </UIButton>
          <UIButton
            size="sm"
            className="h-6"
            onClick={async () => {
              setDownloading(true);
              const onProgress = new Channel<{
                message: [number, number];
                id: number;
              }>();
              onProgress.onmessage = (res) => {
                let [received, all] = res.message;
                setProgress((received / all) * 100);
              };
              try {
                const res = await command("update_plugin", {
                  plugin,
                  onProgress,
                });
                if (res === 1) {
                  message.success(t`已经是最新版`);
                } else {
                  message.success(t`更新成功`);
                }
              } catch (error) {
                console.log(error);
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Space size={4}>
              <ArrowBigUpDash className="w-4 h-4" />
              <Trans>更新</Trans>
            </Space>
          </UIButton>
        </Space>
      ) : (
        <UIButton
          className=" absolute top-4 right-4 h-6"
          size="sm"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            const onProgress = new Channel<{
              message: [number, number];
              id: number;
            }>();
            onProgress.onmessage = (res) => {
              let [received, all] = res.message;
              setProgress((received / all) * 100);
            };
            try {
              await command("download_plugin", {
                plugin,
                onProgress,
              });
              addPlugin(plugin);
              message.success(t`${plugin.title} 安装成功`);
            } catch (error) {
              console.log(error);
            } finally {
              setDownloading(false);
            }
          }}
        >
          <Space size={4}>
            {!downloading && <ArrowBigDownDashIcon className="w-4 h-4" />}
            {downloading ? (
              progress !== 100 ? (
                <Trans>下载中...</Trans>
              ) : (
                <Trans>安装中...</Trans>
              )
            ) : (
              <Trans>安装</Trans>
            )}
          </Space>
        </UIButton>
      )}
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between">{plugin.title}</CardTitle>
        <CardDescription>
          <Space>
            <Trans>作者：{plugin.author}</Trans>
            <Button
              size="small"
              onClick={() => {
                open(plugin.reference);
              }}
              icon={<GithubOutlined />}
            ></Button>
          </Space>
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("px-4 pt-0", downloading ? "pb-0" : "pb-2")}>
        <p className="text-wrap">{plugin.description}</p>
      </CardContent>
      <CardFooter className="py-0 pb-2">
        <Progress
          size="small"
          style={{
            display: downloading ? "block" : "none",
          }}
          percent={progress}
        />
      </CardFooter>
    </Card>
  );
};
