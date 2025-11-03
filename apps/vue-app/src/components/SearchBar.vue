<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const value = ref(props.modelValue);
watch(() => props.modelValue, (v) => (value.value = v));

let t: number | undefined;
function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  value.value = v;
  window.clearTimeout(t);
  t = window.setTimeout(() => emit('update:modelValue', v), 250);
}
</script>

<template>
  <input type="text" :value="value" @input="onInput" placeholder="Найти по ФИО..." />
</template>
