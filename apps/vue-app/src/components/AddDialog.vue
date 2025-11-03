<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import type { Org } from '@/types';

const emit = defineEmits<{ (e:'close'): void; (e:'confirm', org: Org): void }>();

const f = reactive({
  name: '',
  director: '',
  phone: '',
  city: '',
  street: '',
  house: '',
});

const okDisabled = ref(true);
watch(f, () => {
  okDisabled.value = !f.name || !f.director || !f.phone || !f.city || !f.street || !f.house;
});

const dlg = ref<HTMLDialogElement | null>(null);
onMounted(() => dlg.value?.showModal());

function submit() {
  if (okDisabled.value) return;
  const org: Org = {
    id: crypto.randomUUID(),
    name: f.name.trim(),
    director: f.director.trim(),
    phone: f.phone.trim(),
    address: { city: f.city.trim(), street: f.street.trim(), house: f.house.trim() },
  };
  emit('confirm', org);
}
</script>

<template>
  <dialog ref="dlg" @close="emit('close')">
    <div class="dialog-header">
      <h3>Добавить организацию</h3>
      <button class="btn" @click="dlg?.close()">Закрыть</button>
    </div>
    <div class="dialog-body">
      <div class="grid cols-2" style="margin-top:12px;">
        <div>
          <label class="muted">Название</label>
          <input type="text" v-model="f.name" />
        </div>
        <div>
          <label class="muted">ФИО директора</label>
          <input type="text" v-model="f.director" placeholder="Иванов И.И." />
        </div>
      </div>
      <div class="grid cols-3" style="margin-top:12px;">
        <div>
          <label class="muted">Город</label>
          <input type="text" v-model="f.city" />
        </div>
        <div>
          <label class="muted">Улица</label>
          <input type="text" v-model="f.street" />
        </div>
        <div>
          <label class="muted">Дом</label>
          <input type="text" v-model="f.house" />
        </div>
      </div>
      <div class="grid" style="margin-top:12px;">
        <div>
          <label class="muted">Номер телефона</label>
          <input type="tel" v-model="f.phone" placeholder="+7 000 123 45 67" />
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
        <button class="btn" @click="dlg?.close()">Отмена</button>
        <button class="btn primary" :disabled="okDisabled" @click="submit">OK</button>
      </div>
    </div>
  </dialog>
</template>
