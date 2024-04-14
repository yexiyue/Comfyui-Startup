import { command } from "@/api";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useAsyncEffect, useDebounce, useSize } from "ahooks";
import { Input, Segmented } from "antd";
import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { AllPlugin } from "./commponents/AllPlugin";
import { DownloadedPlugin } from "./commponents/DownloadedPlugin";
import { DownloadingPlugin } from "./commponents/DownloadingPlugin";
import { usePluginStore } from "./usestore";

export const Component = () => {
  useLingui();
  const [search, setSearch] = useState<string>("");
  const divRef = useRef<HTMLDivElement>(null);
  const size = useSize(divRef);
  const debouncedSearch = useDebounce(search, { wait: 500 });
  const [setPlugins] = usePluginStore((store) => [store.setPlugins]);

  const [type, setType] = useState("all");

  useAsyncEffect(async () => {
    const res = await command("get_installed_plugins");
    if (res) {
      const plugins: any[] = res
        .map((item) => item[1])
        .filter((item) => item?.install_type === "git-clone");

      setPlugins(plugins);
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div className=" flex justify-between items-center px-4 py-2">
        <p>
          <Trans>插件管理</Trans>
        </p>
        <Segmented
          value={type}
          onChange={(value) => {
            setType(value);
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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t`搜索`}
            prefix={<SearchIcon className="w-4 h-4" />}
            allowClear
          />
        </div>
      </div>
      <div className={cn("w-full", type === "all" ? "block" : "hidden")}>
        <AllPlugin search={debouncedSearch} width={size?.width ?? 0} />
      </div>
      <div
        className={cn("w-full", type === "downloading" ? "block" : "hidden")}
      >
        <DownloadingPlugin search={debouncedSearch} width={size?.width ?? 0} />
      </div>
      <div className={cn("w-full", type === "downloaded" ? "block" : "hidden")}>
        <DownloadedPlugin search={debouncedSearch} width={size?.width ?? 0} />
      </div>
    </div>
  );
};
