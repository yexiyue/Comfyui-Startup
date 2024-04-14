import { command } from "@/api";
import { Model } from "@/api/model";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useAsyncEffect } from "ahooks";
import { App, Empty, Pagination } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useModelDownloadStore } from "../useStore";
import { ModelItem } from "./item";

type AllModelProps = {
  search: string;
  width: number;
  type?: string;
  base?: string;
};

export const AllModel = ({ search, width, type, base }: AllModelProps) => {
  useLingui();
  const { message } = App.useApp();
  const [filterModels, setFilterModels] = useState<Model[]>([]);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState(10);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [base, type]);

  const [downloadedModels] = useModelDownloadStore((store) => [
    Object.keys(store.downloadedModels),
  ]);

  const downloadedKeys = useMemo(() => {
    return new Set(downloadedModels);
  }, [downloadedModels]);

  useAsyncEffect(async () => {
    try {
      const res = await command("get_model_list", {
        search,
        ty: type,
        base,
        pagination: {
          page,
          page_size: pagesize,
        },
      });
      setFilterModels(res[0]);
      setCount(res[1]);
    } catch (error) {
      message.error(t`获取模型列表失败`);
    }
  }, [page, pagesize, search, type, base]);

  return (
    <>
      <ScrollArea className="h-[calc(100vh-176px)] w-full">
        <div
          className="px-4 flex flex-col gap-4 pb-2"
          style={{
            width,
          }}
        >
          {(search || base || type) && filterModels.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t`没有找到模型`}
            ></Empty>
          )}
          {filterModels.map((model) => {
            return (
              <ModelItem
                key={model.id}
                isDownloaded={downloadedKeys.has(model.url)}
                model={model}
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
