import { command } from "@/api";
import { Model } from "@/api/model";
import { Plugin, PluginOnProgress } from "@/api/plugin";
import { Button as UIButton } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notification } from "@/lib/notification";
import { cn } from "@/lib/utils";
import { GithubOutlined } from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Channel } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { useMemoizedFn } from "ahooks";
import { App, Button, Progress, Space, Tag, Typography, theme } from "antd";
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDash,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

type ModelItemProps = {
  model: Model;
  isDownloaded?: boolean;
};

export const ModelItem = ({ model, isDownloaded }: ModelItemProps) => {
  useLingui();
  const themes = theme.useToken();
  const { message } = App.useApp();
  const downloading = false;
  const progress = 0;

  return (
    <Card className="relative">
      {/* {isDownloaded ? (
        <Space className=" absolute top-4 right-4 ">
          <UIButton
            size="sm"
            variant="destructive"
            className="h-6"
            onClick={async () => {
              try {
                await command("remove_plugin", { plugin });
                removePlugin(plugin);
                message.success(t`${plugin.title} 卸载成功`);
              } catch (error) {
                message.error(t`${plugin.title} 卸载失败`);
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
              const onProgress = new Channel<{ message: number; id: number }>();
              onProgress.onmessage = (res) => {
                setProgress(res.message);
              };
              try {
                setDownloading(true);
                setProgress(0);
                const res = await command("update_plugin", {
                  plugin,
                  onProgress,
                });
                if (res === 1) {
                  message.success(t`${plugin.title} 已经是最新版`);
                } else {
                  message.success(t`${plugin.title} 更新成功`);
                }
              } catch (error) {
                message.error(t`${plugin.title} 更新失败`);
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
      ) : downloading ? (
        <Space className=" absolute top-4 right-4 ">
          <UIButton className="h-6" size="sm" disabled>
            <Space size={4}>
              {progress !== 100 ? (
                pending ? (
                  <Trans>等待中...</Trans>
                ) : (
                  <Trans>下载中...</Trans>
                )
              ) : (
                <Trans>安装中...</Trans>
              )}
            </Space>
          </UIButton>
          <UIButton
            className="h-6"
            size="sm"
            onClick={async () => {
              await emit("plugin-cancel", { reference: plugin.reference });
            }}
          >
            <Space size={4}>
              <XIcon className="w-4 h-4" />
              <Trans>取消</Trans>
            </Space>
          </UIButton>
        </Space>
      ) : (
        <UIButton
          className=" absolute top-4 right-4 h-6"
          size="sm"
          onClick={async () => {
            try {
              const onProgress: PluginOnProgress = new Channel();
              onProgress.onmessage = async (res) => {
                const { status, progress, error_message } = res.message;
                if (status === "Pending") {
                  setPending(true);
                }
                if (status === "Downloading" && progress) {
                  setPending(false);
                  setProgress(progress);
                }
                if (status === "Error" && error_message) {
                  // 清理操作
                  setDownloading(false);
                  removeDownloadingPlugin(plugin.reference);
                  await command("remove_plugin", { plugin });
                  message.error({
                    content: (
                      <Space direction="vertical">
                        <Trans>{plugin.title} 安装失败，请稍后再试</Trans>
                        <Typography.Text type="secondary">
                          {error_message}
                        </Typography.Text>
                      </Space>
                    ),
                  });
                }
                if (status === "Success") {
                  // 清理操作
                  setDownloading(false);
                  removeDownloadingPlugin(plugin.reference);
                  // 安装成功后移出下载中，添加到已下载
                  addPlugin(plugin);
                  message.success(t`${plugin.title} 安装成功`);
                  notification({
                    title: t`${plugin.title} 安装成功`,
                    body: t`${plugin.title} 安装成功，请重启ComfyUI`,
                  });
                }
                if (status === "Canceled") {
                  setDownloading(false);
                  removeDownloadingPlugin(plugin.reference);
                  message.success(t`${plugin.title} 取消成功`);
                }
              };
              // 添加到下载中
              setDownloading(true);
              addDownloadingPlugin(plugin);
              setPending(true);
              setProgress(0);
              await command("download_plugin", {
                plugin,
                onProgress,
              });
            } catch (error: any) {
              await command("remove_plugin", { plugin });
              message.error({
                content: (
                  <Space direction="vertical">
                    <Trans>{plugin.title} 安装失败，请稍后再试</Trans>
                    <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                  </Space>
                ),
              });
            }
          }}
        >
          <Space size={4}>
            <ArrowBigDownDashIcon className="w-4 h-4" />
            <Trans>安装</Trans>
          </Space>
        </UIButton>
      )} */}
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between">{model.name}</CardTitle>
        <CardDescription>
          <Space>
            <Tag color={themes.token.colorPrimary}>{model.type}</Tag>
            <Button
              size="small"
              onClick={() => {
                open(model.reference);
              }}
              icon={<GithubOutlined />}
            ></Button>
          </Space>
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("px-4 pt-0", downloading ? "pb-0" : "pb-2")}>
        <p className="text-wrap">{model.description}</p>
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
