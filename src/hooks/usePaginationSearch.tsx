import { Pagination } from "antd";
import { useState, useMemo } from "react";

export const usePaginationSearch = <T extends Record<string, any>>(
  data: T[],
  search: string,
  filterFields: (keyof T)[],
  equals: Partial<T> = {},
  initialPage: number = 1,
  initialPageSize: number = 10
) => {
  const [page, setPage] = useState(initialPage);
  const [pagesize, setPagesize] = useState(initialPageSize);
  // 搜索过滤
  const filterData = useMemo(() => {
    let filterData = data;
    if (search) {
      filterData = data.filter((item) => {
        return filterFields.some((field) => {
          return item[field] && item[field].includes(search);
        });
      });
    }
    if (equals) {
      Object.keys(equals).forEach((key) => {
        if (equals[key]) {
          filterData = filterData.filter((item) => item[key] === equals[key]);
        }
      });
    }
    return filterData;
  }, [search, data]);

  // 分页处理
  const filterPaginationData = useMemo(() => {
    return filterData.slice((page - 1) * pagesize, page * pagesize);
  }, [page, filterData, pagesize]);

  const paginationContainer = (
    <Pagination
      current={page}
      pageSize={pagesize}
      onChange={(page, pageSize) => {
        setPage(page);
        setPagesize(pageSize);
      }}
      pageSizeOptions={[10, 20, 30]}
      total={filterData.length}
    />
  );

  return {
    count: filterData.length,
    filterPaginationData,
    paginationContainer,
  };
};
