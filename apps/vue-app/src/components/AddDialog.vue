<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue';
import type { Org } from '@/types';
import {
  applyMaskedInput,
  formatVisible,
  isAllowedControlKey,
  isDigitKey,
  isComplete,
  isValid,
  normalizeDigits,
  PHONE_TOTAL_DIGITS,
} from '@/utils/phone';

const emit = defineEmits<{ (e:'close'): void; (e:'confirm', org: Org): void }>();

const f = reactive({
  name: '',
  director: '',
  city: '',
  street: '',
  house: '',
  phoneVisible: '', // отображаемая строка "+7 000 ..."
  phoneDigits: '',  // только цифры
});

const touched = reactive({
  name: false,
  director: false,
  city: false,
  street: false,
  house: false,
  phone: false,
});

const phoneComplete = computed(() => isComplete(f.phoneDigits));
const phoneValid = computed(() => isValid(f.phoneDigits));
const requiredOk = computed(() => !!f.name && !!f.director && !!f.city && !!f.street && !!f.house);
const okDisabled = computed(() => !(requiredOk.value && phoneValid.value));

const dlg = ref<HTMLDialogElement | null>(null);
const phoneRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  dlg.value?.showModal();
  // Начальное значение — просто +7
  f.phoneDigits = normalizeDigits('');
  f.phoneVisible = f.phoneDigits ? formatVisible(f.phoneDigits) : '';
});

/** Сколько цифр содержится в видимом диапазоне [start, end) */
function countDigitsInSelection(visible: string, start: number, end: number): number {
  let cnt = 0;
  for (let i = start; i < end; i++) {
    if (/\d/.test(visible[i] ?? '')) cnt++;
  }
  return cnt;
}

function submit() {
  if (okDisabled.value) return;
  const org: Org = {
    id: crypto.randomUUID(),
    name: f.name.trim(),
    director: f.director.trim(),
    phone: f.phoneVisible, // сохраняем отформатированный вид
    address: { city: f.city.trim(), street: f.street.trim(), house: f.house.trim() },
  };
  emit('confirm', org);
}

function blur(field: keyof typeof touched) {
  touched[field] = true;
}

/** KEYDOWN: блокируем всё, кроме цифр и управляющих */
function onPhoneKeydown(e: KeyboardEvent) {
  if (isAllowedControlKey(e)) return;

  const el = e.target as HTMLInputElement;
  const selStart = el.selectionStart ?? el.value.length;
  const selEnd = el.selectionEnd ?? selStart;
  const currentLen = f.phoneDigits.length;
  const replacingDigits = countDigitsInSelection(f.phoneVisible, selStart, selEnd);

  if (isDigitKey(e)) {
    // Если номер уже полный и мы не заменяем цифры — блокируем
    if (currentLen - replacingDigits >= PHONE_TOTAL_DIGITS) {
      e.preventDefault();
      return;
    }
    return; // цифру разрешаем
  }

  // Любые иные символы запрещаем
  e.preventDefault();
}

/** INPUT: применяем маску с учётом выделения/вставки */
function onPhoneInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const selStart = el.selectionStart ?? el.value.length;
  const selEnd = el.selectionEnd ?? el.value.length;

  // Выясняем, что изменилось: берем разницу между тем что было и стало
  // Для надёжности используем applyMaskedInput, прокормив вставленный текст
  // На событии 'input' insertText напрямую не приходит — но браузер уже изменил value.
  // Поэтому проще: строим next из текущего el.value целиком.
  const nextDigits = normalizeDigits(el.value);
  f.phoneDigits = nextDigits;
  f.phoneVisible = nextDigits ? formatVisible(nextDigits) : '';

  // Каретку ставим в конец цифр (удобное поведение); можно усложнить и вычислять точно
  nextTickSetCaretEnd();
  touched.phone = true;
}

/** PASTE: чистим вставку и применяем маску самостоятельно */
function onPhonePaste(e: ClipboardEvent) {
  e.preventDefault();
  const el = e.target as HTMLInputElement;
  const text = e.clipboardData?.getData('text') ?? '';
  const selStart = el.selectionStart ?? 0;
  const selEnd = el.selectionEnd ?? 0;

  const { nextVisible, nextCaret, digits } = applyMaskedInput(
    f.phoneVisible,
    text,
    selStart,
    selEnd
  );
  f.phoneVisible = nextVisible;
  f.phoneDigits = digits;

  // установить каретку
  requestAnimationFrame(() => {
    el.setSelectionRange(nextCaret, nextCaret);
  });
  touched.phone = true;
}

function nextTickSetCaretEnd() {
  requestAnimationFrame(() => {
    const el = phoneRef.value;
    if (!el) return;
    const pos = el.value.length;
    el.setSelectionRange(pos, pos);
  });
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
          <label class="muted" for="name">Название</label>
          <input
            id="name"
            type="text"
            v-model="f.name"
            required
            :aria-invalid="touched.name && !f.name ? 'true' : 'false'"
            @blur="blur('name')"
            :class="touched.name && !f.name ? 'error' : ''"
          />
          <div v-if="touched.name && !f.name" class="help error">Укажите название</div>
        </div>
        <div>
          <label class="muted" for="director">ФИО директора</label>
          <input
            id="director"
            type="text"
            v-model="f.director"
            placeholder="Иванов И.И."
            required
            :aria-invalid="touched.director && !f.director ? 'true' : 'false'"
            @blur="blur('director')"
            :class="touched.director && !f.directор ? 'error' : ''"
          />
          <div v-if="touched.director && !f.director" class="help error">Укажите ФИО</div>
        </div>
      </div>

      <div class="grid cols-3" style="margin-top:12px;">
        <div>
          <label class="muted" for="city">Город</label>
          <input
            id="city"
            type="text"
            v-model="f.city"
            required
            :aria-invalid="touched.city && !f.city ? 'true' : 'false'"
            @blur="blur('city')"
            :class="touched.city && !f.city ? 'error' : ''"
          />
          <div v-if="touched.city && !f.city" class="help error">Укажите город</div>
        </div>
        <div>
          <label class="muted" for="street">Улица</label>
          <input
            id="street"
            type="text"
            v-model="f.street"
            required
            :aria-invalid="touched.street && !f.street ? 'true' : 'false'"
            @blur="blur('street')"
            :class="touched.street && !f.street ? 'error' : ''"
          />
          <div v-if="touched.street && !f.street" class="help error">Укажите улицу</div>
        </div>
        <div>
          <label class="muted" for="house">Дом</label>
          <input
            id="house"
            type="text"
            v-model="f.house"
            required
            :aria-invalid="touched.house && !f.house ? 'true' : 'false'"
            @blur="blur('house')"
            :class="touched.house && !f.house ? 'error' : ''"
          />
          <div v-if="touched.house && !f.house" class="help error">Укажите дом</div>
        </div>
      </div>

      <div class="grid" style="margin-top:12px;">
        <div>
          <label class="muted" for="phone">Номер телефона</label>
          <input
            id="phone"
            ref="phoneRef"
            type="tel"
            :value="f.phoneVisible"
            placeholder="+7 000 000 00 00"
            inputmode="tel"
            autocomplete="tel"
            required
            @keydown="onPhoneKeydown"
            @input="onPhoneInput"
            @paste="onPhonePaste"
            @blur="blur('phone')"
            :aria-invalid="touched.phone && !phoneValid ? 'true' : 'false'"
            aria-describedby="phone-help"
            :class="touched.phone && !phoneValid ? 'error' : ''"
          />
          <div id="phone-help" class="help" :class="touched.phone && !phoneValid ? 'error' : ''">
            Формат: +7 000 000 00 00
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
        <button class="btn" @click="dlg?.close()">Отмена</button>
        <button class="btn primary" :disabled="okDisabled" @click="submit">OK</button>
      </div>
    </div>
  </dialog>
</template>
