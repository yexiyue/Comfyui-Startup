import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, Pagination } from "antd";
import { PluginItem } from "./Item";
import { Skeleton } from "@/components/ui/skeleton";
import { usePluginStore } from "./useStore";
import { useMemo, useState } from "react";
import { t } from "@lingui/macro";

type DownloadedPluginProps = {
  search?: string;
  loading?: boolean;
  width: number;
};

export const DownloadedPlugin = ({
  search,
  loading,
  width,
}: DownloadedPluginProps) => {
  const plugins = usePluginStore((store) =>
    Object.values(store.downloadPlugins)
  );
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState(10);
  // 搜索过滤
  const filterPlugins = useMemo(() => {
    if (search) {
      return plugins.filter(
        (item) =>
          item.title.includes(search) ||
          item.author.includes(search) ||
          item.description.includes(search)
      );
    } else {
      return plugins;
    }
  }, [search, plugins]);

  // 分页处理
  const filterPluginsPagination = useMemo(() => {
    return filterPlugins.slice((page - 1) * pagesize, page * pagesize);
  }, [page, filterPlugins, pagesize]);

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
            filterPlugins.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t`没有找到插件`}
              ></Empty>
            )
          )}
          {filterPluginsPagination.map((plugin) => (
            <PluginItem plugin={plugin} isDownloaded key={plugin.id} />
          ))}
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
          total={filterPlugins.length}
        />
      </div>
    </>
  );
};
