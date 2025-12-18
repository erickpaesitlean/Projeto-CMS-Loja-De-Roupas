export type ProductStatus = 'ATIVO' | 'INATIVO';

export interface EstoquePorLoja {
  lojaId: number;
  quantidade: number;
}

export interface Product {
  id: number;
  nome: string;
  descricao: string;
  categoriaId: number;
  preco: number;
  precoPromocional: number | null;
  sku: string;
  codigoBarras: string;
  tamanhos: string[];
  cores: string[];
  estoquePorLoja: EstoquePorLoja[];
  imagens: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  nome: string;
  descricao: string;
  categoriaId: number;
  preco: number;
  precoPromocional: number | null;
  sku: string;
  codigoBarras: string;
  tamanhos: string[];
  cores: string[];
  estoquePorLoja: EstoquePorLoja[];
  imagens: string[];
  status: ProductStatus;
}







