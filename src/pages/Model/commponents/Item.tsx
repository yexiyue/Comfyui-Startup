import { command } from "@/api";
import { Model, ModelOnProgress } from "@/api/model";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notification } from "@/lib/notification";
import { cn, formatToBytes } from "@/lib/utils";
import { useConfigStore } from "@/usestore";
import {
  CloseOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  LinkOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Channel } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { useMemoizedFn } from "ahooks";
import { App, Button, Progress, Space, Tag, Tooltip, Typography } from "antd";
import { SlashIcon } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { useModelDownloadStore } from "../usestore";
import { CustomLink } from "@/components/CustomLink";

type ModelItemProps = {
  model: Model;
  isDownloaded?: boolean;
};

export const ModelItem = ({ model, isDownloaded }: ModelItemProps) => {
  useLingui();
  const [language] = useConfigStore((store) => [store.language]);
  const { message } = App.useApp();
  const [
    downloadingModel,
    addDownloadingModel,
    addDownloadedModel,
    setProgress,
    removeDownloadingModel,
    removeDownloadedModel,
  ] = useModelDownloadStore((store) => [
    store.downloadingModels[model.url],
    store.addDownloadingModel,
    store.addDownloadedModel,
    store.setProgress,
    store.removeDownloadingModel,
    store.removeDownloadedModel,
  ]);
  const downloading = downloadingModel?.status !== undefined;

  const [taskLoading, setTaskLoading] = useState(false);

  const onDownloadingProgress = useMemoizedFn(() => {
    const onProgress: ModelOnProgress = new Channel();
    onProgress.onmessage = ({
      message: { speed, status, progress, error_message },
    }) => {
      setProgress(model.url, progress, status, speed);
      if (status === "failed") {
        message.error({
          content: (
            <Space direction="vertical">
              <Trans>{model.name} 下载失败，请稍后再试</Trans>
              <Typography.Text type="secondary">
                {error_message}
              </Typography.Text>
            </Space>
          ),
        });
      }

      if (status === "success") {
        addDownloadedModel(model);
        removeDownloadingModel(model.url);
        message.success(t`${model.name} 下载成功`);
        notification({
          title: t`${model.name} 下载成功`,
        });
      }
    };
    return onProgress;
  });

  return (
    <Card className="relative min-w-[560px]">
      {isDownloaded ? (
        <Space className=" absolute top-4 right-4 ">
          <Tooltip title={<Trans>删除</Trans>}>
            <Button
              size="small"
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                try {
                  await command("remove", { url: model.url });
                  removeDownloadedModel(model.url);
                  message.success({
                    content: t`${model.name} 删除成功`,
                  });
                } catch (error) {
                  message.error({
                    content: (
                      <Space direction="vertical">
                        <Trans>{model.name} 删除失败</Trans>
                        <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                      </Space>
                    ),
                  });
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
              loading={taskLoading}
              icon={<CloseOutlined />}
              onClick={async () => {
                try {
                  setTaskLoading(true);
                  await command("remove", { url: model.url });
                  removeDownloadingModel(model.url);
                  message.success({
                    content: t`${model.name} 取消成功`,
                  });
                } catch (error) {
                  message.error({
                    content: (
                      <Space direction="vertical">
                        <Trans>{model.name} 取消失败</Trans>
                        <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                      </Space>
                    ),
                  });
                } finally {
                  setTaskLoading(false);
                }
              }}
            ></Button>
          </Tooltip>
          {downloadingModel.status === "pending" && (
            <Button
              size="small"
              loading
              type="primary"
              style={{ fontSize: 12 }}
            >
              <Trans>等待中</Trans>
            </Button>
          )}
          {downloadingModel.status === "running" && (
            <Tooltip title={<Trans>暂停</Trans>}>
              <Button
                size="small"
                type="primary"
                icon={<PauseCircleOutlined />}
                onClick={async () => {
                  try {
                    await command("cancel", {
                      taskId: downloadingModel.taskId!,
                    });
                  } catch (error) {
                    message.error({
                      content: (
                        <Space direction="vertical">
                          <Trans>{model.name} 暂停失败</Trans>
                          <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                        </Space>
                      ),
                    });
                  }
                }}
              ></Button>
            </Tooltip>
          )}
          {downloadingModel.status === "failed" && (
            <Tooltip title={<Trans>重新下载</Trans>}>
              <Button
                size="small"
                type="primary"
                loading={taskLoading}
                icon={<PlayCircleOutlined />}
                onClick={async () => {
                  try {
                    setTaskLoading(true);
                    const onProgress = onDownloadingProgress();
                    await command("restore", {
                      taskId: downloadingModel.taskId!,
                      onProgress,
                    });
                  } catch (error) {
                    message.error({
                      content: (
                        <Space direction="vertical">
                          <Trans>{model.name} 重新下载失败</Trans>
                          <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                        </Space>
                      ),
                    });
                  } finally {
                    setTaskLoading(false);
                  }
                }}
              ></Button>
            </Tooltip>
          )}
          {downloadingModel.status === "paused" && (
            <Tooltip title={<Trans>恢复下载</Trans>}>
              <Button
                size="small"
                type="primary"
                loading={taskLoading}
                icon={<PlayCircleOutlined />}
                onClick={async () => {
                  try {
                    setTaskLoading(true);
                    const onProgress = onDownloadingProgress();
                    await command("restore", {
                      taskId: downloadingModel.taskId!,
                      onProgress,
                    });
                  } catch (error) {
                    message.error({
                      content: (
                        <Space direction="vertical">
                          <Trans>{model.name} 恢复下载失败</Trans>
                          <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                        </Space>
                      ),
                    });
                  } finally {
                    setTaskLoading(false);
                  }
                }}
              ></Button>
            </Tooltip>
          )}
        </Space>
      ) : (
        <Space className="absolute top-4 right-4">
          <Tooltip title={<Trans>下载</Trans>}>
            <Button
              size="small"
              type="primary"
              loading={taskLoading}
              icon={<CloudDownloadOutlined />}
              onClick={async () => {
                try {
                  setTaskLoading(true);
                  const onProgress = onDownloadingProgress();
                  const taskId = await command("download", {
                    model,
                    onProgress,
                  });
                  addDownloadingModel(model, taskId);
                } catch (error) {
                  message.error({
                    content: (
                      <Space direction="vertical">
                        <Trans>{model.name} 下载失败，请稍后再试</Trans>
                        <Typography.Text type="secondary">{`${error}`}</Typography.Text>
                      </Space>
                    ),
                  });
                } finally {
                  setTaskLoading(false);
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
                title: model.name,
              },
            }}
          >
            {model.name}
          </Typography.Text>
        </CardTitle>
        <CardDescription>
          <Space size={2}>
            <Tooltip
              title={
                <span className="text-xs">
                  <Trans>模型类型: {model.type}</Trans>
                </span>
              }
            >
              <Tag color="cyan" className="cursor-default">
                {model.type}
              </Tag>
            </Tooltip>
            <Tooltip
              title={
                <span className="text-xs">
                  <Trans>基础类型: {model.base}</Trans>
                </span>
              }
            >
              <Tag color="orange" className="cursor-default">
                {model.base}
              </Tag>
            </Tooltip>
            <Tooltip
              title={
                <span className="text-xs">
                  <Trans>模型文件名: {model.filename}</Trans>
                </span>
              }
            >
              <Tag
                icon={<FileOutlined />}
                color="geekblue"
                className="cursor-default"
              >
                {model.filename}
              </Tag>
            </Tooltip>

            <Button
              size="small"
              onClick={() => {
                open(model.reference);
              }}
              icon={<LinkOutlined />}
            />
          </Space>
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("px-4 pt-0", downloading ? "pb-0" : "pb-2")}>
        <Markdown
          components={{
            a: CustomLink,
          }}
        >
          {language === "zh" ? model.zh_description : model.description}
        </Markdown>
      </CardContent>
      <CardFooter className="pb-2 justify-between">
        <Progress
          size="small"
          className="flex-1"
          style={{
            display: downloading ? "block" : "none",
          }}
          percent={
            downloadingModel?.progress
              ? Math.floor(
                  (downloadingModel.progress[0] /
                    downloadingModel.progress[1]) *
                    100
                )
              : 0
          }
        />
        <div className="w-[200px] flex justify-end items-center gap-2">
          {downloadingModel?.speed && (
            <Typography.Text
              type="secondary"
              className="text-nowrap whitespace-nowrap ml-2"
              style={{
                fontSize: 12,
              }}
            >
              {formatToBytes(downloadingModel.speed)}/s
            </Typography.Text>
          )}
          {downloadingModel?.progress && (
            <div className="flex items-center">
              <Typography.Text
                type="secondary"
                className="text-nowrap whitespace-nowrap"
                style={{
                  fontSize: 12,
                }}
              >
                {formatToBytes(downloadingModel.progress[0])}
              </Typography.Text>
              <SlashIcon
                className="w-3 h-3"
                style={{
                  transform: "rotate(-25deg)",
                }}
              />
              <Typography.Text
                type="secondary"
                className="text-nowrap whitespace-nowrap"
                style={{
                  fontSize: 12,
                }}
              >
                {formatToBytes(downloadingModel.progress[1])}
              </Typography.Text>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
