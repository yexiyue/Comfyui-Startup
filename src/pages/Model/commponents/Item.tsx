import { command } from "@/api";
import { Model, ModelOnProgress } from "@/api/model";
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
import { cn, formatToBytes } from "@/lib/utils";
import { FileOutlined, LinkOutlined } from "@ant-design/icons";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Channel } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { useMemoizedFn } from "ahooks";
import { App, Button, Progress, Space, Tag, Typography, theme } from "antd";
import {
  ArrowBigDownDashIcon,
  SlashIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useModelDownloadStore } from "../useStore";

type ModelItemProps = {
  model: Model;
  isDownloaded?: boolean;
};

export const ModelItem = ({ model, isDownloaded }: ModelItemProps) => {
  useLingui();
  const themes = theme.useToken();
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
    <Card className="relative min-w-[600px]">
      {isDownloaded ? (
        <UIButton
          size="sm"
          variant="destructive"
          className="h-6 absolute top-4 right-4"
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
        >
          <Space size={4}>
            <Trash2Icon className="w-4 h-4" />
            <Trans>删除</Trans>
          </Space>
        </UIButton>
      ) : downloading ? (
        <Space className=" absolute top-4 right-4 ">
          <UIButton
            className="h-6"
            size="sm"
            onClick={async () => {
              try {
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
              }
            }}
          >
            <Space size={4}>
              <Trans>取消</Trans>
            </Space>
          </UIButton>
          {downloadingModel.status === "running" && (
            <UIButton
              className="h-6"
              size="sm"
              onClick={async () => {
                try {
                  await command("cancel", { taskId: downloadingModel.taskId! });
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
            >
              <Space size={4}>
                <XIcon className="w-4 h-4" />
                <Trans>暂停</Trans>
              </Space>
            </UIButton>
          )}
          {downloadingModel.status === "failed" && (
            <UIButton
              className="h-6"
              size="sm"
              onClick={async () => {
                try {
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
                }
              }}
            >
              <Space size={4}>
                <XIcon className="w-4 h-4" />
                <Trans>重新下载</Trans>
              </Space>
            </UIButton>
          )}
          {downloadingModel.status === "paused" && (
            <UIButton
              className="h-6"
              size="sm"
              onClick={async () => {
                try {
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
                }
              }}
            >
              <Space size={4}>
                <XIcon className="w-4 h-4" />
                <Trans>恢复下载</Trans>
              </Space>
            </UIButton>
          )}
        </Space>
      ) : (
        <UIButton
          className=" absolute top-4 right-4 h-6"
          size="sm"
          onClick={async () => {
            try {
              const onProgress = onDownloadingProgress();
              const taskId = await command("download", { model, onProgress });
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
            }
          }}
        >
          <Space size={4}>
            <ArrowBigDownDashIcon className="w-4 h-4" />
            <Trans>下载</Trans>
          </Space>
        </UIButton>
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
            <Tag color={themes.token.colorPrimary}>{model.type}</Tag>
            <Tag color="orange">{model.base}</Tag>
            <Tag icon={<FileOutlined />} color="geekblue">
              {model.filename}
            </Tag>
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
        <p className="text-wrap">{model.description}</p>
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
