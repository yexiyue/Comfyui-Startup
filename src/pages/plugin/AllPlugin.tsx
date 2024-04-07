import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, Pagination, message } from "antd";
import { PluginItem } from "./Item";
import { Skeleton } from "@/components/ui/skeleton";
import { usePluginStore } from "./useStore";
import { useState } from "react";
import { t } from "@lingui/macro";
import { command } from "@/api";
import { Plugin } from "@/api/plugin";
import { useAsyncEffect } from "ahooks";

type AllPluginProps = {
  search?: string;
  width: number;
};

export const AllPlugin = ({ search, width }: AllPluginProps) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState(10);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const downloadedKeys = usePluginStore(
    (store) => new Set(Object.keys(store.downloadPlugins))
  );

  useAsyncEffect(async () => {
    try {
      setLoading(true);
      const res = await command("get_plugin_list", {
        search: search ?? "",
        pagination: {
          page,
          page_size: pagesize,
        },
      });

      if (res) {
        setPlugins(res[0]);
        setCount(res[1]);
      }
    } catch (error) {
      message.error(t`获取插件列表失败`);
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [search, page, pagesize]);

  return (
    <>
      <ScrollArea className="h-[calc(100vh-176px)] w-full">
        <div
          className="px-4 flex flex-col gap-4 pb-2"
          style={{
            width,
          }}
        >
          {loading ? (
            <div className="flex flex-col space-y-3">
              {Array.from(Array(5)).map((_, index) => (
                <Skeleton key={index} className="h-[125px] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            search &&
            plugins.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t`没有找到插件`}
              ></Empty>
            )
          )}
          {plugins.map((plugin) => {
            return (
              <PluginItem
                plugin={plugin}
                isDownloaded={downloadedKeys.has(plugin.reference)}
                key={plugin.id}
              />
            );
          })}
        </div>
      </ScrollArea>
      <div className="w-full flex justify-end p-4">
        <Pagination
          current={page}
          pageSize={pagesize}
          onChange={(page, pageSize) => {
            setPage(page);
            setPagesize(pageSize);
          }}
          pageSizeOptions={[10, 20, 30]}
          total={count}
        />
      </div>
    </>
  );
};
