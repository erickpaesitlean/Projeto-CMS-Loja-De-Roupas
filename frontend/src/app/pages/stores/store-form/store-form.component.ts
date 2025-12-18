import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store, StoreFormData, StoreType, StoreStatus } from '../../../models/store.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './store-form.component.html',
  styleUrl: './store-form.component.scss'
})
export class StoreFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  storeForm!: FormGroup;
  isEditMode = signal(false);
  storeId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode.set(true);
      this.storeId.set(+id);
      this.loadStore(+id);
    }

    this.initForm();
    this.setupTypeWatcher();
  }

  private initForm(): void {
    this.storeForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['FISICA' as StoreType, Validators.required],
      endereco: this.fb.group({
        logradouro: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        cidade: [''],
        estado: [''],
        cep: ['']
      }),
      horarioFuncionamento: ['', [Validators.required]],
      status: ['ATIVA' as StoreStatus, Validators.required]
    });
  }

  private setupTypeWatcher(): void {
    // Observar mudanças no tipo para validar endereço
    this.storeForm.get('tipo')?.valueChanges.subscribe(tipo => {
      const enderecoGroup = this.storeForm.get('endereco') as FormGroup;
      
      if (tipo === 'FISICA') {
        // Adicionar validações obrigatórias para endereço
        enderecoGroup.get('logradouro')?.setValidators([Validators.required]);
        enderecoGroup.get('numero')?.setValidators([Validators.required]);
        enderecoGroup.get('bairro')?.setValidators([Validators.required]);
        enderecoGroup.get('cidade')?.setValidators([Validators.required]);
        enderecoGroup.get('estado')?.setValidators([Validators.required]);
        enderecoGroup.get('cep')?.setValidators([Validators.required]);
      } else {
        // Remover validações e limpar campos para loja online
        enderecoGroup.get('logradouro')?.clearValidators();
        enderecoGroup.get('numero')?.clearValidators();
        enderecoGroup.get('bairro')?.clearValidators();
        enderecoGroup.get('cidade')?.clearValidators();
        enderecoGroup.get('estado')?.clearValidators();
        enderecoGroup.get('cep')?.clearValidators();
        
        // Limpar valores
        enderecoGroup.reset();
      }
      
      // Atualizar validações
      enderecoGroup.get('logradouro')?.updateValueAndValidity();
      enderecoGroup.get('numero')?.updateValueAndValidity();
      enderecoGroup.get('bairro')?.updateValueAndValidity();
      enderecoGroup.get('cidade')?.updateValueAndValidity();
      enderecoGroup.get('estado')?.updateValueAndValidity();
      enderecoGroup.get('cep')?.updateValueAndValidity();
    });
  }

  get enderecoForm(): FormGroup {
    return this.storeForm.get('endereco') as FormGroup;
  }

  get isPhysicalStore(): boolean {
    return this.storeForm.get('tipo')?.value === 'FISICA';
  }

  private loadStore(id: number): void {
    this.loading.set(true);
    this.storeService.getStoreById(id).subscribe({
      next: (store) => {
        this.storeForm.patchValue({
          nome: store.nome,
          tipo: store.tipo,
          horarioFuncionamento: store.horarioFuncionamento,
          status: store.status
        });

        // Preencher endereço se existir
        if (store.endereco) {
          this.enderecoForm.patchValue(store.endereco);
        } else {
          this.enderecoForm.reset();
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar loja:', err);
        this.error.set('Erro ao carregar loja.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.storeForm.invalid) {
      this.markFormGroupTouched(this.storeForm);
      return;
    }

    // Validar endereço para lojas físicas
    if (this.isPhysicalStore) {
      const endereco = this.enderecoForm.value;
      if (!this.storeService.isAddressComplete(endereco)) {
        this.error.set('Por favor, preencha todos os campos de endereço para lojas físicas.');
        this.markFormGroupTouched(this.enderecoForm);
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);

    const formData: StoreFormData = {
      nome: this.storeForm.value.nome,
      tipo: this.storeForm.value.tipo,
      endereco: this.isPhysicalStore ? this.enderecoForm.value : null,
      horarioFuncionamento: this.storeForm.value.horarioFuncionamento,
      status: this.storeForm.value.status
    };

    console.log('Dados do formulário:', formData);
    console.log('Modo de edição:', this.isEditMode());
    console.log('ID da loja:', this.storeId());

    const operation = this.isEditMode()
      ? this.storeService.updateStore(this.storeId()!, formData)
      : this.storeService.createStore(formData);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/lojas']);
      },
      error: (err) => {
        console.error('Erro ao salvar loja:', err);
        console.error('Detalhes do erro:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url
        });
        this.error.set(err.error?.message || 'Erro ao salvar loja. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/lojas']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string, formGroup?: FormGroup): string | null {
    const group = formGroup || this.storeForm;
    const field = group.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo de ${requiredLength} caracteres`;
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const group = formGroup || this.storeForm;
    const field = group.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}






