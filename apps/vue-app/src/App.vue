<script setup lang="ts">
import { ref } from 'vue';
import { seed } from '@/data/seed';
import { useDirectory } from '@/composables/useDirectory';
import type { Org, SortKey } from '@/types';
import SearchBar from '@/components/SearchBar.vue';
import OrgTable from '@/components/OrgTable.vue';
import AddDialog from '@/components/AddDialog.vue';

const { state, pageItems, pageCount, setPage, setPageSize, setSort, add, remove, setQuery } = useDirectory(seed);
const showAdd = ref(false);

function onAdd(org: Org) {
  add(org);
  showAdd.value = false;
}

function onSort(key: SortKey) {
  setSort(key);
}
</script>

<template>
  <div class="container">
    <h1 style="margin:0 0 12px 0;">Справочник организаций</h1>

    <div class="toolbar">
      <SearchBar :model-value="state.query" @update:modelValue="setQuery" />
      <button class="btn primary" @click="showAdd = true">Добавить</button>
    </div>

    <div class="card">
      <OrgTable
        :items="pageItems"
        :sort-key="state.sortKey"
        :sort-dir="state.sortDir"
        @sort="onSort"
        @remove="remove"
      />

      <div class="pagination">
        <label class="muted">на странице</label>
        <select :value="state.pageSize" @change="setPageSize(+((($event.target as HTMLSelectElement).value)))">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
        <button class="btn" @click="setPage(state.page - 1)" :disabled="state.page === 1">Назад</button>
        <span>стр. {{ state.page }} / {{ pageCount }}</span>
        <button class="btn" @click="setPage(state.page + 1)" :disabled="state.page >= pageCount">Вперёд</button>
      </div>
    </div>

    <AddDialog v-if="showAdd" @close="showAdd = false" @confirm="onAdd" />
  </div>
</template>
