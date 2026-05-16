export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};

export type PaginatedResult<T> = {
  meta: PaginationMeta;
  result: T[];
};

export type PageQueryInput = {
  page?: number;
  size?: number;
  sort?: string | string[];
};

export const PAGINATION_INDEX_BASE: 0 | 1 = 0;

export function toApiPage(uiPage: number) {
  return PAGINATION_INDEX_BASE === 1 ? uiPage : Math.max(uiPage - 1, 0);
}

export function fromApiPage(apiPage: number) {
  return PAGINATION_INDEX_BASE === 1 ? apiPage : apiPage + 1;
}

export function buildPageQuery({ page = 1, size = 20, sort }: PageQueryInput = {}) {
  const params = new URLSearchParams();

  params.set('page', String(toApiPage(page)));
  params.set('size', String(size));

  if (Array.isArray(sort)) {
    sort.forEach((item) => params.append('sort', item));
  } else if (sort) {
    params.set('sort', sort);
  }

  return params;
}

export function getTotalItems<T>(page: PaginatedResult<T> | undefined) {
  return page?.meta.totalItems ?? 0;
}
