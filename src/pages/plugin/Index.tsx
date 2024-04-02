import { command } from "@/api";
import { Plugin } from "@/api/plugin";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trans, t } from "@lingui/macro";
import { useAsyncEffect, useDebounce, useSize } from "ahooks";
import { Empty, Input, Segmented, Select } from "antd";
import { SearchIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PluginItem } from "./Item";
import { usePluginStore } from "./useStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Component = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("title");
  const divRef = useRef<HTMLDivElement>(null);
  const size = useSize(divRef);
  const debouncedSearch = useDebounce(search, { wait: 500 });
  const [downloadPlugins] = usePluginStore((store) => [store.downloadPlugins]);
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);

  const downloadPluginList = useMemo(() => {
    return Object.values(downloadPlugins);
  }, [downloadPlugins]);

  const downloadKeys = useMemo(() => {
    return new Set(Object.keys(downloadPlugins));
  }, []);

  useAsyncEffect(async () => {
    const res = await command("get_plugin_list");
    if (res) {
      setPlugins(res.custom_nodes);
    }
    setLoading(false);
  }, []);

  const filterPlugins = useMemo(() => {
    let pluginList = plugins;
    if (type === "installed") {
      pluginList = downloadPluginList;
    }

    if (debouncedSearch) {
      return pluginList.filter((plugin) => {
        return (plugin as any)[searchType].includes(debouncedSearch);
      });
    } else {
      return pluginList;
    }
  }, [debouncedSearch, plugins, searchType, type, downloadPluginList]);

  return (
    <div>
      <div className=" flex justify-between items-center px-4 py-2">
        <p>插件管理</p>
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
              label: <Trans>已安装</Trans>,
              value: "installed",
            },
          ]}
        />
      </div>
      <Separator />
      <div ref={divRef} className="p-4">
        <div className="w-full flex gap-4">
          <Select
            value={searchType}
            onChange={(v) => setSearchType(v)}
            className="w-[100px]"
            options={[
              {
                label: <Trans>标题</Trans>,
                value: "title",
              },
              {
                label: <Trans>作者</Trans>,
                value: "author",
              },

              {
                label: <Trans>描述</Trans>,
                value: "description",
              },
            ]}
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
      <ScrollArea className=" h-[calc(100vh-128px)] w-full">
        <div
          className={t`px-4 flex flex-col gap-4`}
          style={{
            width: size?.width,
          }}
        >
          {search && filterPlugins.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t`没有找到插件`}
            ></Empty>
          )}
          {loading && (
            <div className="flex flex-col space-y-3">
              {Array.from(Array(5)).map((_, index) => (
                <Skeleton key={index} className="h-[125px] w-full rounded-xl" />
              ))}
            </div>
          )}
          {filterPlugins.map((plugin) => (
            <PluginItem
              plugin={plugin}
              isDownloaded={downloadKeys.has(
                `${plugin.title}-${plugin.reference}`
              )}
              key={`${plugin.title}-${plugin.reference}`}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
