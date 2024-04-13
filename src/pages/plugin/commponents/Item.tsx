import { command } from "@/api";
import { Plugin, PluginOnProgress } from "@/api/plugin";
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
import { useConfigStore } from "@/useStore";
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  GithubOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Channel } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { useMemoizedFn } from "ahooks";
import { App, Button, Progress, Space, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import Markdown from "react-markdown";
import { useDownloadingPlugins, usePluginStore } from "../useStore";
import { CustomLink } from "@/components/CustomLink";

type PluginItemProps = {
  plugin: Plugin;
  isDownloaded?: boolean;
};

export const PluginItem = ({ plugin, isDownloaded }: PluginItemProps) => {
  useLingui();
  const [language] = useConfigStore((store) => [store.language]);
  const { message } = App.useApp();
  const [removePlugin, addPlugin] = usePluginStore((store) => [
    store.removePlugin,
    store.addPlugin,
  ]);

  const [
    progress,
    addDownloadingPlugin,
    setDownloadingPluginProgress,
    removeDownloadingPlugin,
  ] = useDownloadingPlugins((store) => [
    store.downloadingPluginProgress[plugin.reference],
    store.addDownloadingPlugin,
    store.setDownloadingPluginProgress,
    store.removeDownloadingPlugin,
  ]);
  const [downloading, setDownloading] = useState(progress !== undefined);
  const [pending, setPending] = useState(progress === 0);
  const setProgress = useMemoizedFn((value: number) => {
    setDownloadingPluginProgress(plugin.reference, value);
  });

  return (
    <Card className="relative">
      {isDownloaded ? (
        <Space className=" absolute top-4 right-4 ">
          <Tooltip title={<Trans>卸载</Trans>}>
            <Button
              size="small"
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                try {
                  await command("remove_plugin", { plugin });
                  removePlugin(plugin);
                  message.success(t`${plugin.title} 卸载成功`);
                } catch (error) {
                  message.error(t`${plugin.title} 卸载失败`);
                }
              }}
            ></Button>
          </Tooltip>
          <Tooltip title={<Trans>更新</Trans>}>
            <Button
              size="small"
              type="primary"
              icon={<UploadOutlined />}
              onClick={async () => {
                const onProgress = new Channel<{
                  message: number;
                  id: number;
                }>();
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
            ></Button>
          </Tooltip>
        </Space>
      ) : downloading ? (
        <Space className=" absolute top-4 right-4 ">
          <Tooltip title={<Trans>取消</Trans>}>
            <Button
              size="small"
              type="primary"
              danger
              icon={<CloseOutlined />}
              onClick={async () => {
                await emit("plugin-cancel", { reference: plugin.reference });
              }}
            ></Button>
          </Tooltip>
          <Button size="small" loading type="primary" style={{ fontSize: 12 }}>
            <>
              {progress !== 100 ? (
                pending ? (
                  <Trans>等待中</Trans>
                ) : (
                  <Trans>下载中</Trans>
                )
              ) : (
                <Trans>安装中</Trans>
              )}
            </>
          </Button>
        </Space>
      ) : (
        <Space className=" absolute top-4 right-4 ">
          <Tooltip title={<Trans>安装</Trans>}>
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
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
            ></Button>
          </Tooltip>
        </Space>
      )}
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between pr-[160px]">
          <Typography.Text
            ellipsis={{
              tooltip: {
                title: plugin.title,
              },
            }}
          >
            {plugin.title}
          </Typography.Text>
        </CardTitle>
        <CardDescription>
          <Space>
            <Tooltip
              title={
                <span className="text-xs">
                  <Trans>作者: {plugin.author}</Trans>
                </span>
              }
            >
              <Tag color="gold" className="cursor-default">
                {plugin.author}
              </Tag>
            </Tooltip>
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
        <Markdown
          components={{
            a: CustomLink,
          }}
        >
          {language === "zh" ? plugin.zh_description : plugin.description}
        </Markdown>
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
