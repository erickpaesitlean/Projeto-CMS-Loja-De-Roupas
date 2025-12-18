export type TipoLog = 'create' | 'edit' | 'update' | 'delete' | 'inactive' | 'active' | 'move';

export interface Log {
  id: number;
  tipo: TipoLog;
  entidade: string;
  descricao: string;
  dataHora: string;
  usuarioId?: number;
  usuarioNome?: string;
}

