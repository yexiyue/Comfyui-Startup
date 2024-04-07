import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginationSearch } from "@/pages/Plugin/hooks/usePaginationSearch";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Empty, Pagination } from "antd";
import { useDownloadingPlugins } from "../useStore";
import { PluginItem } from "./Item";

type DownloadingPluginProps = {
  search: string;
  loading?: boolean;
  width: number;
};

export const DownloadingPlugin = ({
  search,
  loading,
  width,
}: DownloadingPluginProps) => {
  useLingui();
  const [plugins] = useDownloadingPlugins((store) => [
    Object.values(store.downloadingPlugins),
  ]);
  const { page, pagesize, setPage, setPagesize, count, filterPaginationData } =
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
              description={t`暂无下载中的插件`}
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
          {filterPaginationData.map((plugin) => {
            return <PluginItem plugin={plugin} key={plugin.id} />;
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
