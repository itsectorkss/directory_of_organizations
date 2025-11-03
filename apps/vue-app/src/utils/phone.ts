/**
 * Маска и нормализация для российского номера в формате:
 * Ввод/хранение: 11 цифр, первая — код страны 7
 * Отображение:   "+7 000 000 00 00"
 *
 * Особенности:
 * - Буквы/нецифры запрещены (фильтруются на этапе вставки и блокируются на keydown)
 * - 8 в начале → 7
 * - Если первая цифра не 7/8, принудительно добавляем 7 префиксом
 * - Макс. 11 цифр
 * - Возвращаем форматированную строку, флаги валидности и индексы для корректной каретки
 */

export const PHONE_TOTAL_DIGITS = 11; // включая ведущую 7
const VISIBLE_TEMPLATE = '+7 000 000 00 00';
const GROUPS = [3, 3, 2, 2]; // после +7

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

/** Нормализует набор цифр (без форматирующих символов) под нашу модель */
export function normalizeDigits(raw: string): string {
  let d = onlyDigits(raw);

  if (!d) return '';

  // Замена 8 на 7
  if (d.startsWith('8')) d = '7' + d.slice(1);

  // Если не начинается с 7 — добавляем 7 как код страны
  if (!d.startsWith('7')) d = '7' + d;

  // Отрезаем по максимуму
  d = d.slice(0, PHONE_TOTAL_DIGITS);

  return d;
}

/** Форматирует 11-значную строку (или короче) как "+7 000 000 00 00" */
export function formatVisible(digits: string): string {
  // digits уже должен начинаться с 7
  if (!digits) return '';

  const d = digits.slice(1); // без кода страны
  const g1 = d.slice(0, GROUPS[0]);
  const g2 = d.slice(GROUPS[0], GROUPS[0] + GROUPS[1]);
  const g3 = d.slice(GROUPS[0] + GROUPS[1], GROUPS[0] + GROUPS[1] + GROUPS[2]);
  const g4 = d.slice(GROUPS[0] + GROUPS[1] + GROUPS[2], PHONE_TOTAL_DIGITS - 1);

  let out = '+7';
  if (g1) out += ' ' + g1;
  if (g2) out += ' ' + g2;
  if (g3) out += ' ' + g3;
  if (g4) out += ' ' + g4;

  return out;
}

export function isComplete(digits: string): boolean {
  return digits.length === PHONE_TOTAL_DIGITS;
}

export function isValid(digits: string): boolean {
  // здесь можно усиливать правила (например, запрет "000" в префиксе),
  // базово: номер полный и начинается с 7
  return isComplete(digits) && digits.startsWith('7');
}

/**
 * Принимает текущее отображаемое значение (с пробелами), вставляемый текст, позиции каретки
 * и возвращает «следующее» отображаемое значение + позицию каретки.
 */
export function applyMaskedInput(
  currentVisible: string,
  insertText: string,
  selStart: number,
  selEnd: number
): { nextVisible: string; nextCaret: number; digits: string } {
  // Текущие чистые цифры
  const currentDigits = normalizeDigits(currentVisible);

  // Какие цифры останутся после удаления выделения
  const before = currentVisible.slice(0, selStart);
  const after = currentVisible.slice(selEnd);

  // Удаляем выделенный диапазон «логически» — по цифрам
  const digitsBefore = onlyDigits(formatToDigitsContext(before, currentDigits));
  const digitsAfter = onlyDigits(formatToDigitsContext(after, currentDigits, false));

  // Новые вводимые цифры
  const newDigitsInserted = onlyDigits(insertText);

  // Собираем «сырые» цифры заново
  let merged = ('7' + (digitsBefore + newDigitsInserted + digitsAfter)).replace(/^77+/, '7');
  merged = normalizeDigits(merged);

  const nextVisible = merged ? formatVisible(merged) : '';
  const nextCaret = visibleCaretFromDigitsLength(nextVisible, merged.length);

  return { nextVisible, nextCaret, digits: merged };
}

/**
 * Хак-помощник: восстанавливает «контекст цифр» из видимой части.
 * Нам важно правильно разбить на левые/правые цифры относительно каретки.
 */
function formatToDigitsContext(
  visibleFragment: string,
  fullDigits: string,
  fromStart = true
): string {
  // Сопоставим «карта символов»: на каждую цифру укажем её позицию в видимой строке
  const map = buildDigitIndexMap(formatVisible(fullDigits)); // позиции видимых цифр
  const digits = fullDigits.split('');

  if (fromStart) {
    // сколько видимых символов от начала — столько же цифр заберем слева
    const countVisible = visibleFragment.length;
    const take = map.filter((pos) => pos < countVisible).length;
    return digits.slice(1, 1 + take).join(''); // без первой «7»
  } else {
    // правая часть: считаем от конца
    const countVisibleRight = visibleFragment.length;
    const take = map.filter((pos) => pos >= (formatVisible(fullDigits).length - countVisibleRight)).length;
    const rightDigits = digits.slice(1).slice(-take);
    return rightDigits.join('');
  }
}

/** Возвращает индексы, где стоят цифры во «видимой» строке */
function buildDigitIndexMap(visible: string): number[] {
  const idx: number[] = [];
  for (let i = 0; i < visible.length; i++) {
    if (/\d/.test(visible[i])) idx.push(i);
  }
  return idx;
}

/** Каретка ставится на позицию после последней введённой цифры */
function visibleCaretFromDigitsLength(visible: string, lengthDigits: number): number {
  if (!visible) return 0;
  // длина цифр включает ведущую 7, видимая строка включает символы + и пробелы
  const map = buildDigitIndexMap(visible);
  const targetIndex = Math.min(lengthDigits - 1, map.length ? map.length : 0); // -1 т.к. первая цифра — 7
  const pos = map[targetIndex] !== undefined ? map[targetIndex] + 1 : visible.length;
  return Math.min(pos, visible.length);
}

/** Разрешённые клавиши управления */
export function isAllowedControlKey(e: KeyboardEvent): boolean {
  const allowed = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab',
  ];
  // Разрешаем Ctrl/Meta+A/C/V/X/Z/Y
  if (e.ctrlKey || e.metaKey) return true;
  return allowed.includes(e.key);
}

/** Разрешён ли ввод цифры (остальные символы блокируем в keydown) */
export function isDigitKey(e: KeyboardEvent): boolean {
  return /^[0-9]$/.test(e.key);
}
