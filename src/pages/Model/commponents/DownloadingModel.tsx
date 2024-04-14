import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginationSearch } from "@/hooks/usePaginationSearch";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Empty } from "antd";
import { useModelDownloadStore } from "../useStore";
import { ModelItem } from "./item";

type DownloadingModelProps = {
  search: string;
  loading?: boolean;
  width: number;
  type?: string;
  base?: string;
};

export const DownloadingModel = ({
  search,
  loading,
  width,
  type,
  base,
}: DownloadingModelProps) => {
  useLingui();
  const [models] = useModelDownloadStore((store) => [
    Object.values(store.downloadingModels),
  ]);

  const { count, filterPaginationData, paginationContainer } =
    usePaginationSearch(models, search, ["name", "description", "filename"], {
      type,
      base,
    });

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
          ) : models.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t`暂无下载中的模型`}
            ></Empty>
          ) : (
            count === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t`没有找到模型`}
              ></Empty>
            )
          )}
          {filterPaginationData.map((model) => {
            return <ModelItem model={model} key={model.id} />;
          })}
        </div>
      </ScrollArea>
      <div className="w-full flex justify-end p-4">{paginationContainer}</div>
    </>
  );
};
