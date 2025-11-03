<script setup lang="ts">
import type { Org, SortDir, SortKey } from '@/types';
import TableHeaderSortable from './TableHeaderSortable.vue';

const props = defineProps<{ items: Org[]; sortKey: SortKey; sortDir: SortDir }>();
const emit = defineEmits<{ (e: 'sort', by: SortKey): void; (e: 'remove', id: string): void }>();

function addr(a: Org['address']) {
  return `г. ${a.city}, ул. ${a.street}, д. ${a.house}`;
}
</script>

<template>
  <table>
    <thead>
      <tr>
        <TableHeaderSortable label="Название" by="name" :active="props.sortKey==='name'" :dir="props.sortDir" @sort="(b)=>emit('sort', b)" />
        <TableHeaderSortable label="ФИО директора" by="director" :active="props.sortKey==='director'" :dir="props.sortDir" @sort="(b)=>emit('sort', b)" />
        <th>Номер телефона</th>
        <th>Адрес</th>
        <th class="right">Удалить</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="o in props.items" :key="o.id">
        <td>{{ o.name }}</td>
        <td>{{ o.director }}</td>
        <td>{{ o.phone }}</td>
        <td>{{ addr(o.address) }}</td>
        <td class="right"><span class="x" title="Удалить" @click="emit('remove', o.id)">×</span></td>
      </tr>
      <tr v-if="!props.items.length">
        <td colspan="5" class="muted">Нет данных</td>
      </tr>
    </tbody>
  </table>
</template>
