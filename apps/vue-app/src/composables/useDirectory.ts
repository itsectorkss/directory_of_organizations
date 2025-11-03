import { computed, reactive, watch } from 'vue';
import type { Org, SortDir, SortKey } from '@/types';

const LS_KEY = 'org-directory-state-v1';

type State = {
  items: Org[];
  sortKey: SortKey;
  sortDir: SortDir;
  query: string; // фильтр по ФИО
  page: number; // 1-based
  pageSize: number;
};

const state = reactive<State>({
  items: [],
  sortKey: 'director',
  sortDir: 'asc',
  query: '',
  page: 1,
  pageSize: 10,
});

function load(initial: Org[]) {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as State;
      Object.assign(state, parsed);
    } catch {
      state.items = initial;
    }
  }
  if (!state.items?.length) state.items = initial;
}

watch(state, () => {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
});

function setSort(key: SortKey) {
  if (state.sortKey === key) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortKey = key;
    state.sortDir = 'asc';
  }
}

function add(item: Org) {
  state.items = [item, ...state.items];
}

function remove(id: string) {
  state.items = state.items.filter((x) => x.id !== id);
}

const filtered = computed(() => {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.items;
  return state.items.filter((x) => x.director.toLowerCase().includes(q));
});

const sorted = computed(() => {
  const arr = [...filtered.value];
  const dir = state.sortDir === 'asc' ? 1 : -1;
  const key = state.sortKey;
  arr.sort((a, b) => {
    const av = key === 'name' ? a.name : a.director;
    const bv = key === 'name' ? b.name : b.director;
    return av.localeCompare(bv, 'ru') * dir;
  });
  return arr;
});

const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / state.pageSize)));

const pageItems = computed(() => {
  const start = (state.page - 1) * state.pageSize;
  return sorted.value.slice(start, start + state.pageSize);
});

function setQuery(q: string) {
  state.query = q;
  state.page = 1; // сброс на первую страницу при фильтре
}

function setPage(p: number) {
  state.page = Math.min(Math.max(1, p), pageCount.value);
}

function setPageSize(size: number) {
  state.pageSize = size;
  setPage(1);
}

export function useDirectory(initial: Org[] = []) {
  if (!state.items.length) load(initial);
  return { state, pageItems, pageCount, setPage, setPageSize, setSort, add, remove, setQuery };
}
