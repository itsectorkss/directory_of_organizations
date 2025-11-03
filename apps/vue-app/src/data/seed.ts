import type { Org } from '@/types';

function fake(n: number): Org[] {
  const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
  const streets = ['Ленина', 'Невский проспект', 'Садовая', 'Советская', 'Гагарина'];
  const surnames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов'];
  const initials = ['И.И.', 'П.П.', 'С.С.', 'А.А.', 'К.К.'];

  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(),
    name: i % 3 === 0 ? `ООО "Вектор ${i}"` : i % 3 === 1 ? `ИП ${surnames[i % surnames.length]}` : `АО "Альфа ${i}"`,
    director: `${surnames[i % surnames.length]} ${initials[i % initials.length]}`,
    phone: `+7 000 ${String(100 + (i % 900)).padStart(3, '0')} ${String(10 + (i % 90)).padStart(2, '0')} ${String(10 + (i % 90)).padStart(2, '0')}`,
    address: {
      city: cities[i % cities.length],
      street: streets[i % streets.length],
      house: String(1 + (i % 50)),
    },
  }));
}

export const seed: Org[] = fake(120);
