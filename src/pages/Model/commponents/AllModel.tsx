import { command } from "@/api";
import { Model } from "@/api/model";
import { useAsyncEffect } from "ahooks";
import { useState } from "react";

type AllModelProps = {
  search: string;
  width: number;
  type: string;
  base: string;
};
export const AllModel = ({ search, width, type, base }: AllModelProps) => {
  const [loading, setLoading] = useState(true);
  const [filterModels, setFilterModels] = useState<Model[]>([]);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState(10);
  const [count, setCount] = useState(0);
  useAsyncEffect(async () => {
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
  }, [page, pagesize, search]);
  return <div>all</div>;
};
