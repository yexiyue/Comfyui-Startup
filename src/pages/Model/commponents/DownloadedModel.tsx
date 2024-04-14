import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginationSearch } from "@/hooks/usePaginationSearch";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Empty } from "antd";
import { useModelDownloadStore } from "../usestore";
import { ModelItem } from "./Item";

type DownloadedModelProps = {
  search: string;
  loading?: boolean;
  width: number;
  type?: string;
  base?: string;
};

export const DownloadedModel = ({
  search,
  loading,
  width,
  base,
  type,
}: DownloadedModelProps) => {
  useLingui();
  const models = useModelDownloadStore((store) =>
    Object.values(store.downloadedModels)
  );
  const { count, filterPaginationData, paginationContainer } =
    usePaginationSearch(models, search, ["name", "description", "filename"], {
      base,
      type,
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
              description={t`您还未下载过模型`}
            ></Empty>
          ) : (
            count === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t`没有找到模型`}
              ></Empty>
            )
          )}
          {filterPaginationData.map((model) => (
            <ModelItem model={model} isDownloaded key={model.id} />
          ))}
        </div>
      </ScrollArea>
      <div className="w-full flex justify-end p-4">{paginationContainer}</div>
    </>
  );
};
