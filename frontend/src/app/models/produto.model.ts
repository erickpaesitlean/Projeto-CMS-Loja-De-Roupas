export interface Produto {
  id: number;
  nome: string;
  sku: string;
  ativo: boolean;
  estoque: number;
  preco: number;
  precoPromocional: number | null;
  promocaoAtiva: boolean;
  categoriaId: number;
  lojaId: number;
  imagens: string[];
}







