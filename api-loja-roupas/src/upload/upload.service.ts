import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'produtos');
  private readonly baseUrl = process.env.API_URL || 'http://localhost:3000';

  constructor() {
    // Garantir que o diretório existe
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  getUploadPath(): string {
    return this.uploadPath;
  }

  getFileUrl(filename: string): string {
    // Retorna URL completa do backend para que o frontend possa acessar
    return `${this.baseUrl}/uploads/produtos/${filename}`;
  }
}


