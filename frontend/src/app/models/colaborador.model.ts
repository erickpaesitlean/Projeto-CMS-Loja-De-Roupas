/**
 * Modelo de Colaborador completo (com senha) - usado apenas para autenticação
 */
export interface Colaborador {
  id: number;
  nome: string;
  email: string;
  senha: string;
  status: 'ativo' | 'inativo';
  cargo?: string;
}

/**
 * Modelo de Colaborador logado (sem senha) - usado após autenticação
 */
export interface ColaboradorLogado {
  id: number;
  nome: string;
  email: string;
  status: 'ativo' | 'inativo';
  cargo?: string;
}

/**
 * Dados de login
 */
export interface LoginCredentials {
  email: string;
  senha: string;
}

/**
 * Resultado do login
 */
export interface LoginResult {
  success: boolean;
  message?: string;
  colaborador?: ColaboradorLogado;
  token?: string; // JWT token para autenticação
}

