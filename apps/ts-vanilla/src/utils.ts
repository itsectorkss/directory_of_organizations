export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {
  let t = 0 as unknown as number;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

// Маска телефона как в варианте Vue
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

export function formatRuPhone(input: string) {
  let d = digitsOnly(input);
  if (!d) return { raw: '', formatted: '', isComplete: false, isValid: false };

  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);

  const rest = d.slice(1);
  const g1 = rest.slice(0, 3);
  const g2 = rest.slice(3, 6);
  const g3 = rest.slice(6, 8);
  const g4 = rest.slice(8, 10);

  const formatted =
    '+7' +
    (g1 ? ' ' + g1 : '') +
    (g2 ? ' ' + g2 : '') +
    (g3 ? ' ' + g3 : '') +
    (g4 ? ' ' + g4 : '');

  const isComplete = rest.length === 10;
  return { raw: d, formatted, isComplete, isValid: isComplete };
}
