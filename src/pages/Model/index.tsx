import { command } from "@/api";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { getCurrent } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useAsyncEffect, useDebounce, useSize } from "ahooks";
import { Input, Segmented, Select, SelectProps } from "antd";
import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { AllModel } from "./commponents/AllModel";
import { DownloadedModel } from "./commponents/DownloadedModel";
import { DownloadingModel } from "./commponents/DownloadingModel";
import { useModelDownloadStore } from "./useStore";

export const Component = () => {
  useLingui();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, { wait: 500 });
  const [viewType, setViewType] = useState("all");
  const [type, setType] = useState("");
  const [base, setBase] = useState("");
  const [types, setTypes] = useState<SelectProps["options"]>([]);
  const [bases, setBases] = useState<SelectProps["options"]>([]);
  const [setDownloadingModel, setDownloadedModel] = useModelDownloadStore(
    (store) => [store.setDownloadingModel, store.setDownloadedModel]
  );

  // 同步数据库中的下载任务
  useAsyncEffect(async () => {
    const downloadedModels = await command("get_download_model", {
      isDownloading: false,
    });
    const downloadingModels = await command("get_download_model", {
      isDownloading: true,
    });

    setDownloadedModel(downloadedModels);
    setDownloadingModel(downloadingModels);
  }, []);

  // 获取宽度
  const divRef = useRef<HTMLDivElement>(null);
  const size = useSize(divRef);

  useAsyncEffect(async () => {
    const types: any = await command("get_model_type_groups");
    types.unshift({ label: t`全部`, value: "" });
    setTypes(types);
    const bases: any = await command("get_model_base_groups");
    bases.unshift({ label: t`全部`, value: "" });
    setBases(bases);
  }, []);

  const props = {
    type,
    base,
    search: debouncedSearch,
    width: size?.width ?? 0,
  };

  return (
    <div className="w-full h-full">
      <div className=" flex justify-between items-center px-4 py-2">
        <p>
          <Trans>模型管理</Trans>
        </p>
        <Segmented
          value={viewType}
          onChange={(value) => {
            setViewType(value);
          }}
          options={[
            {
              label: <Trans>全部</Trans>,
              value: "all",
            },
            {
              label: <Trans>下载中</Trans>,
              value: "downloading",
            },
            {
              label: <Trans>已安装</Trans>,
              value: "downloaded",
            },
          ]}
        />
      </div>
      <Separator />
      <div ref={divRef} className="p-4">
        <div className="w-full flex gap-4">
          <Select
            className="w-[250px]"
            showSearch
            value={type}
            onChange={(value) => setType(value)}
            options={types}
          />
          <Select
            className="w-[250px]"
            value={base}
            showSearch
            onChange={(value) => setBase(value)}
            options={bases}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t`搜索`}
            prefix={<SearchIcon className="w-4 h-4" />}
            allowClear
          />
        </div>
      </div>

      <div className={cn("w-full", viewType === "all" ? "block" : "hidden")}>
        <AllModel {...props} />
      </div>
      <div
        className={cn(
          "w-full",
          viewType === "downloading" ? "block" : "hidden"
        )}
      >
        <DownloadingModel {...props} />
      </div>
      <div
        className={cn("w-full", viewType === "downloaded" ? "block" : "hidden")}
      >
        <DownloadedModel {...props} />
      </div>
    </div>
  );
};
