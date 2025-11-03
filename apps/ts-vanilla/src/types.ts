export type Org = {
  id: string;
  name: string;
  director: string;
  phone: string;
  address: { city: string; street: string; house: string };
};

export type SortKey = 'name' | 'director';
export type SortDir = 'asc' | 'desc';

export type State = {
  items: Org[];
  sortKey: SortKey;
  sortDir: SortDir;
  query: string;
  page: number;      // 1-based
  pageSize: number;
};
