<script setup lang="ts">
import type { SortDir, SortKey } from '@/types';
const props = defineProps<{ label: string; by: SortKey; active: boolean; dir: SortDir }>();
const emit = defineEmits<{ (e: 'sort', by: SortKey): void }>();
</script>

<template>
  <th class="sortable" @click="emit('sort', props.by)">
    <span>{{ props.label }}</span>
    <span v-if="props.active" class="muted"> {{ props.dir === 'asc' ? '↑' : '↓' }}</span>
  </th>
</template>
