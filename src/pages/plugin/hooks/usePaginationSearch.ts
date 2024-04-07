import { useState, useMemo } from "react";

export const usePaginationSearch = <T extends Record<string, any>>(
  data: T[],
  search: string,
  filterFields: (keyof T)[],
  initialPage: number = 1,
  initialPageSize: number = 10
) => {
  const [page, setPage] = useState(initialPage);
  const [pagesize, setPagesize] = useState(initialPageSize);
  // 搜索过滤
  const filterPlugins = useMemo(() => {
    if (search) {
      return data.filter((item) => {
        return filterFields.some((field) => {
          return item[field] && item[field].includes(search);
        });
      });
    } else {
      return data;
    }
  }, [search, data]);

  // 分页处理
  const filterPaginationData = useMemo(() => {
    return filterPlugins.slice((page - 1) * pagesize, page * pagesize);
  }, [page, filterPlugins, pagesize]);

  return {
    count: filterPlugins.length,
    page,
    pagesize,
    setPage,
    setPagesize,
    filterPaginationData,
  };
};
