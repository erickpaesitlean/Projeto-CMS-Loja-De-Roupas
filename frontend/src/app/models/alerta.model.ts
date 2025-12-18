export type TipoAlerta = 'info' | 'warning' | 'error';

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  titulo: string;
  descricao: string;
  dataHora: string;
}







