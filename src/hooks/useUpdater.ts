import { t } from "@lingui/macro";
import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, CheckOptions, Update } from "@tauri-apps/plugin-updater";
import { useAsyncEffect, useMemoizedFn } from "ahooks";
import { App } from "antd";
import { useRef, useState } from "react";

type UpdaterOptions = CheckOptions & {
  manual?: boolean;
  showMessage?: boolean;
};

export const useUpdater = (props: UpdaterOptions = {}) => {
  const { manual, showMessage, ...checkOps } = props;
  const [progress, setProgress] = useState(0);
  const [updating, setUpdating] = useState(false);
  const updaterRef = useRef<Update | null>(null);
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const { message } = App.useApp();

  const checkUpdate = useMemoizedFn(async () => {
    const updater = await check(checkOps);
    if (updater?.available) {
      setShouldUpdate(true);
      updaterRef.current = updater;
      return true;
    }
    return false;
  });

  useAsyncEffect(async () => {
    if (!manual) {
      try {
        await checkUpdate();
      } catch (error) {
        message.error(t`获取更新信息失败`);
      }
    }
  }, []);

  const update = useMemoizedFn(async () => {
    try {
      if (!updaterRef.current) return;
      const updater = updaterRef.current;
      setUpdating(true);
      await updater.downloadAndInstall((p) => {
        if (p.event === "Progress") {
          setProgress(p.data.chunkLength);
        }
      });

      setUpdating(false);
      const res = await ask(t`更新下载完成，是否立即重启应用？`, {
        title: t`提示`,
        kind: "info",
      });

      if (res) {
        await relaunch();
      }
    } catch (error) {
      showMessage && message.error(`${error}`);
      setUpdating(false);
    }
  });

  return { shouldUpdate, progress, updating, update, checkUpdate };
};
