import { useMemo, useState } from "react";

// Small client-side pagination helper shared by the hub portal's tables —
// avoids re-deriving page math (and resetting to page 1 on filter change)
// in every route that lists shipments/exceptions/transfers.
export function usePagedRows<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  return {
    page: safePage,
    pageCount,
    pageRows,
    setPage: (p: number) => setPage(Math.min(Math.max(1, p), pageCount)),
    resetPage: () => setPage(1),
  };
}
