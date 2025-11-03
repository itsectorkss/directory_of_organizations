import type { Org, SortDir, SortKey, State } from './types';

const LS_KEY = 'org-directory-state-vanilla-v1';

let state: State = {
  items: [],
  sortKey: 'director',
  sortDir: 'asc',
  query: '',
  page: 1,
  pageSize: 10
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function init(initial: Org[]) {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as State;
      state = parsed;
    } catch { state.items = initial; }
  }
  if (!state.items?.length) state.items = initial;
  notify();
}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function notify() {
  persist();
  listeners.forEach(l => l());
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): State {
  return state;
}

export function setSort(key: SortKey) {
  if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  else { state.sortKey = key; state.sortDir = 'asc'; }
  notify();
}

export function setQuery(q: string) {
  state.query = q;
  state.page = 1;
  notify();
}

export function setPage(p: number) {
  const pc = pageCount();
  state.page = Math.min(Math.max(1, p), pc);
  notify();
}

export function setPageSize(size: number) {
  state.pageSize = size;
  state.page = 1;
  notify();
}

export function add(org: Org) {
  state.items = [org, ...state.items];
  notify();
}

export function remove(id: string) {
  state.items = state.items.filter(x => x.id !== id);
  notify();
}

// selectors
export function filtered(): Org[] {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.items;
  return state.items.filter(x => x.director.toLowerCase().includes(q));
}
export function sorted(): Org[] {
  const arr = [...filtered()];
  const dir = state.sortDir === 'asc' ? 1 : -1;
  const key = state.sortKey;
  arr.sort((a, b) => {
    const av = key === 'name' ? a.name : a.director;
    const bv = key === 'name' ? b.name : b.director;
    return av.localeCompare(bv, 'ru') * dir;
  });
  return arr;
}
export function pageCount(): number {
  return Math.max(1, Math.ceil(sorted().length / state.pageSize));
}
export function pageItems(): Org[] {
  const start = (state.page - 1) * state.pageSize;
  return sorted().slice(start, start + state.pageSize);
}
