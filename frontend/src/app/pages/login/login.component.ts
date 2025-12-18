import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  ngOnInit(): void {
    // Se já estiver logado, redirecionar para o dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.initForm();
  }

  /**
   * Inicializa o formulário de login com validações
   */
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Verifica se um campo está inválido e foi tocado
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Retorna a mensagem de erro de um campo
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }

    if (field.errors['email']) {
      return 'E-mail inválido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} deve ter no mínimo ${minLength} caracteres`;
    }

    return '';
  }

  /**
   * Retorna o label do campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      email: 'E-mail',
      senha: 'Senha'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Submete o formulário de login
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marcar todos os campos como touched para exibir erros
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const credentials = {
      email: this.loginForm.value.email,
      senha: this.loginForm.value.senha
    };

    this.authService.login(credentials).subscribe({
      next: (result) => {
        this.loading.set(false);
        
        if (!result.success) {
          this.error.set(result.message || 'Erro ao fazer login');
        }
        // Se sucesso, o AuthService já redireciona
      },
      error: (err) => {
        console.error('Erro ao fazer login:', err);
        this.loading.set(false);
        this.error.set('Erro ao conectar com o servidor. Tente novamente.');
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }
}

