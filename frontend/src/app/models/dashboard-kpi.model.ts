import { IconName } from '../shared/icons/icon.component';

export interface DashboardKPI {
  titulo: string;
  valor: number;
  icone: IconName;
  rota?: string;
  cor?: string;
}

