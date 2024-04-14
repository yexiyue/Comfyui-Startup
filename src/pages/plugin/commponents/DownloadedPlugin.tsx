import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginationSearch } from "@/hooks/usePaginationSearch";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Empty } from "antd";
import { usePluginStore } from "../useStore";
import { PluginItem } from "./Item";

type DownloadedPluginProps = {
  search: string;
  loading?: boolean;
  width: number;
};

export const DownloadedPlugin = ({
  search,
  loading,
  width,
}: DownloadedPluginProps) => {
  useLingui();
  const plugins = usePluginStore((store) =>
    Object.values(store.downloadPlugins)
  );
  const { count, filterPaginationData, paginationContainer } =
    usePaginationSearch(plugins, search, ["title", "description"]);

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
          ) : plugins.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t`您还未安装过插件`}
            ></Empty>
          ) : (
            search &&
            count === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t`没有找到插件`}
              ></Empty>
            )
          )}
          {filterPaginationData.map((plugin) => (
            <PluginItem plugin={plugin} isDownloaded key={plugin.id} />
          ))}
        </div>
      </ScrollArea>
      <div className="w-full flex justify-end p-4">{paginationContainer}</div>
    </>
  );
};
