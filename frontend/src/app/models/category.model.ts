export type CategoryStatus = 'ATIVA' | 'INATIVA';

export interface Category {
  id: number;
  nome: string;
  descricao: string;
  slug: string;
  categoriaPaiId: number | null;
  status: CategoryStatus;
}

export interface CategoryFormData {
  nome: string;
  descricao: string;
  slug: string;
  categoriaPaiId: number | null;
  status: CategoryStatus;
}







