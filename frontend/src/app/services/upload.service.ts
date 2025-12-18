import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface UploadResponse {
  success: boolean;
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Faz upload de uma imagem de produto
   */
  uploadProductImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload/produtos`, formData);
  }

  /**
   * Faz upload de múltiplas imagens
   */
  uploadProductImages(files: File[]): Observable<UploadResponse[]> {
    const uploads = files.map(file => this.uploadProductImage(file));
    return new Observable(observer => {
      const results: UploadResponse[] = [];
      let completed = 0;

      uploads.forEach((upload, index) => {
        upload.subscribe({
          next: (response) => {
            results[index] = response;
            completed++;
            if (completed === files.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
          }
        });
      });
    });
  }
}



