export type Sort<TSortBy> = {
  by: TSortBy;
  direction: "asc" | "desc";
};

export type Sorting = Sort<string>;

const changeSort = <TSortBy>(
  sort: Sort<TSortBy>,
  by: TSortBy,
  setSort: (newSort: Sort<TSortBy>) => void,
) => {
  if (by !== sort.by) {
    setSort({
      direction: "desc",
      by: by,
    });
    return;
  }

  setSort({
    direction: sort.direction === "desc" ? "asc" : "desc",
    by: sort.by,
  });
};

export default changeSort;

export const sortIcon = (sort: Sort<string>, by: string) => {
  return sort.by === by && sort.direction === "desc"
    ? "chevron-down"
    : "chevron-up";
};
