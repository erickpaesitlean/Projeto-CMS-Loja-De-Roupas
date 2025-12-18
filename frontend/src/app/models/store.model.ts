export type StoreType = 'FISICA' | 'ONLINE';
export type StoreStatus = 'ATIVA' | 'INATIVA';

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Store {
  id: number;
  nome: string;
  tipo: StoreType;
  endereco: Endereco | null;
  horarioFuncionamento: string;
  status: StoreStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoreFormData {
  nome: string;
  tipo: StoreType;
  endereco: Endereco | null;
  horarioFuncionamento: string;
  status: StoreStatus;
}







