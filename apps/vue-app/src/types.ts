export type Org = {
  id: string;
  name: string;
  director: string; // ФИО
  phone: string;
  address: {
    city: string;
    street: string;
    house: string;
  };
};

export type SortKey = 'name' | 'director';
export type SortDir = 'asc' | 'desc';
