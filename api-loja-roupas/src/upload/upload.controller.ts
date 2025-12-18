import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadService } from './upload.service';
import { existsSync, mkdirSync } from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('produtos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: (() => {
        // Obter o caminho diretamente do serviço
        const uploadPath = join(process.cwd(), 'uploads', 'produtos');
        
        // Garantir que o diretório existe
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        
        return diskStorage({
          destination: (req, file, cb) => {
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            // Gerar nome único: timestamp + número aleatório + extensão
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `${uniqueSuffix}${ext}`;
            cb(null, filename);
          },
        });
      })(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        // Aceitar apenas imagens
        if (
          file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/) ||
          file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Apenas arquivos de imagem são permitidos (JPG, PNG, GIF, WebP)',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const url = this.uploadService.getFileUrl(file.filename);
    
    // Log para debug
    console.log('📤 Upload realizado:', {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: url,
      path: file.path
    });

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      url: url,
      size: file.size,
    };
  }
}
