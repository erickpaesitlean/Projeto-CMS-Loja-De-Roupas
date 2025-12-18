# Documento de Testes de Experiência do Usuário (UX)
## CMS Loja de Roupas

## Informações do Documento
- **Versão:** 1.0
- **Data:** 2024
- **Projeto:** CMS Loja de Roupas
- **Foco:** Experiência do Usuário e Interface

---

## Índice
1. [Testes de Login e Autenticação](#1-testes-de-login-e-autenticação)
2. [Testes da Página Inicial (Dashboard)](#2-testes-da-página-inicial-dashboard)
3. [Testes de Gestão de Produtos](#3-testes-de-gestão-de-produtos)
4. [Testes de Gestão de Categorias](#4-testes-de-gestão-de-categorias)
5. [Testes de Gestão de Lojas](#5-testes-de-gestão-de-lojas)
6. [Testes de Busca e Navegação](#6-testes-de-busca-e-navegação)
7. [Testes de Responsividade e Acessibilidade](#7-testes-de-responsividade-e-acessibilidade)

---

## 1. Testes de Login e Autenticação

### UX-001: Fluxo Completo de Login - Sucesso
**Prioridade:** Crítica  
**Descrição:** Verificar se o usuário consegue fazer login com sucesso e ser redirecionado.

**Cenário:**
1. Usuário acessa a página de login
2. Preenche email: `gerente1@loja.com`
3. Preenche senha: `123456`
4. Clica em "Entrar"

**Resultado Esperado:**
- ✅ Campo de email aceita entrada
- ✅ Campo de senha oculta a senha (tipo password)
- ✅ Botão "Entrar" fica habilitado quando campos preenchidos
- ✅ Após clicar, mostra feedback visual (loading/spinner)
- ✅ Redireciona automaticamente para o dashboard
- ✅ Usuário permanece logado ao recarregar a página
- ✅ Nome do usuário aparece na interface

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-002: Login com Credenciais Inválidas
**Prioridade:** Crítica  
**Descrição:** Verificar feedback ao usuário quando credenciais estão incorretas.

**Cenário:**
1. Usuário acessa a página de login
2. Preenche email válido
3. Preenche senha incorreta
4. Clica em "Entrar"

**Resultado Esperado:**
- ✅ Mensagem de erro clara e visível aparece
- ✅ Mensagem indica "Senha inválida" ou "Credenciais inválidas"
- ✅ Mensagem aparece próximo aos campos ou em destaque
- ✅ Campos não são limpos (usuário pode corrigir)
- ✅ Foco volta para o campo de senha
- ✅ Usuário pode tentar novamente sem recarregar a página

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-003: Validação de Campos no Login
**Prioridade:** Alta  
**Descrição:** Verificar validação visual dos campos de login.

**Cenário:**
1. Usuário acessa a página de login
2. Tenta enviar formulário sem preencher campos
3. Preenche email em formato inválido
4. Preenche apenas um dos campos

**Resultado Esperado:**
- ✅ Botão "Entrar" desabilitado quando campos vazios
- ✅ Mensagens de validação aparecem ao tentar enviar vazio
- ✅ Email inválido mostra mensagem: "Email deve ser um endereço válido"
- ✅ Campos obrigatórios marcados visualmente (asterisco ou similar)
- ✅ Mensagens de erro aparecem em vermelho ou cor de destaque
- ✅ Mensagens desaparecem quando erro é corrigido

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-004: Logout
**Prioridade:** Alta  
**Descrição:** Verificar se o usuário consegue fazer logout corretamente.

**Cenário:**
1. Usuário está logado no sistema
2. Clica no botão/menu de logout
3. Confirma logout (se houver confirmação)

**Resultado Esperado:**
- ✅ Botão de logout visível e acessível
- ✅ Ao clicar, redireciona para página de login
- ✅ Sessão é encerrada (não consegue acessar páginas protegidas)
- ✅ Mensagem de "Logout realizado com sucesso" (opcional)
- ✅ Ao tentar voltar, não consegue acessar conteúdo protegido

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 2. Testes da Página Inicial (Dashboard)

### UX-005: Visualização dos Cards de Resumo
**Prioridade:** Crítica  
**Descrição:** Verificar se os cards de resumo são exibidos corretamente.

**Cenário:**
1. Usuário faz login e acessa o dashboard
2. Observa os cards de resumo na tela

**Resultado Esperado:**
- ✅ Cards são exibidos em grid organizado
- ✅ Cada card mostra:
  - Ícone representativo
  - Título claro
  - Valor numérico grande e legível
  - Cor diferenciada por tipo
- ✅ Cards são clicáveis e redirecionam para página relacionada
- ✅ Valores são atualizados em tempo real
- ✅ Layout responsivo (funciona em diferentes tamanhos de tela)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-006: Interação com Cards de Resumo
**Prioridade:** Alta  
**Descrição:** Verificar se ao clicar nos cards, o usuário é redirecionado corretamente.

**Cenário:**
1. Usuário está no dashboard
2. Clica no card "Total de Produtos"
3. Clica no card "Produtos Ativos"
4. Clica no card "Lojas Cadastradas"

**Resultado Esperado:**
- ✅ Ao clicar em "Total de Produtos", vai para lista de produtos
- ✅ Ao clicar em "Produtos Ativos", vai para lista filtrada por ativos
- ✅ Ao clicar em "Lojas", vai para lista de lojas
- ✅ Transição suave entre páginas
- ✅ Filtros aplicados corretamente quando necessário

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-007: Visualização de Alertas
**Prioridade:** Alta  
**Descrição:** Verificar se os alertas são exibidos de forma clara e útil.

**Cenário:**
1. Usuário acessa o dashboard
2. Observa a seção de alertas

**Resultado Esperado:**
- ✅ Alertas são exibidos em lista ou cards
- ✅ Cada alerta mostra:
  - Tipo (info/warning/error) com ícone e cor
  - Título claro
  - Descrição explicativa
  - Data/hora
- ✅ Alertas críticos aparecem primeiro ou destacados
- ✅ Usuário pode fechar/dismiss alertas (se aplicável)
- ✅ Alertas são atualizados automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-008: Atalhos Rápidos
**Prioridade:** Alta  
**Descrição:** Verificar se os atalhos rápidos funcionam corretamente.

**Cenário:**
1. Usuário está no dashboard
2. Clica em "Cadastrar novo produto"
3. Clica em "Cadastrar nova categoria"
4. Clica em "Adicionar loja"

**Resultado Esperado:**
- ✅ Botões de atalho são visíveis e destacados
- ✅ Ao clicar, abre formulário de cadastro correspondente
- ✅ Formulário abre em modal ou nova página
- ✅ Usuário pode preencher e salvar diretamente
- ✅ Após salvar, retorna ao dashboard ou mostra confirmação

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-009: Exibição do Último Usuário Logado
**Prioridade:** Média  
**Descrição:** Verificar se informações do último usuário são exibidas.

**Cenário:**
1. Usuário A faz login e realiza ações
2. Usuário A faz logout
3. Usuário B faz login
4. Usuário B observa informações do último usuário

**Resultado Esperado:**
- ✅ Informações do último usuário são exibidas claramente
- ✅ Mostra nome e cargo do último usuário
- ✅ Mostra timestamp do último login
- ✅ Informação é útil para rastreabilidade

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-010: Log de Últimas Ações
**Prioridade:** Média  
**Descrição:** Verificar se o log de últimas ações é exibido de forma clara.

**Cenário:**
1. Usuário está no dashboard
2. Observa a seção de últimas ações/log

**Resultado Esperado:**
- ✅ Log mostra últimas ações realizadas
- ✅ Cada entrada mostra:
  - Tipo de ação (criado, editado, removido)
  - Entidade afetada (Produto, Categoria, Loja)
  - Descrição clara
  - Data/hora
  - Usuário que realizou (se aplicável)
- ✅ Log é ordenado por data (mais recente primeiro)
- ✅ Log é limitado a um número razoável (ex: 10 últimas)
- ✅ Usuário pode ver mais clicando em "Ver todos os logs"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-011: Barra de Busca Global
**Prioridade:** Crítica  
**Descrição:** Verificar se a busca global funciona de forma intuitiva.

**Cenário:**
1. Usuário está no dashboard
2. Digita "camiseta" na barra de busca
3. Observa os resultados

**Resultado Esperado:**
- ✅ Barra de busca é visível e fácil de encontrar
- ✅ Placeholder indica o que pode ser buscado
- ✅ Busca é realizada enquanto digita (debounce) ou ao pressionar Enter
- ✅ Resultados aparecem em dropdown ou página separada
- ✅ Resultados mostram:
  - Produtos encontrados
  - Categorias encontradas
  - Lojas encontradas
- ✅ Cada resultado é clicável e leva à página correspondente
- ✅ Se não houver resultados, mostra mensagem clara
- ✅ Busca funciona com pelo menos 2 caracteres

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 3. Testes de Gestão de Produtos

### UX-012: Listagem de Produtos
**Prioridade:** Crítica  
**Descrição:** Verificar se a lista de produtos é exibida de forma clara e útil.

**Cenário:**
1. Usuário acessa a página de produtos
2. Observa a lista de produtos

**Resultado Esperado:**
- ✅ Lista mostra produtos em cards ou tabela organizada
- ✅ Cada produto mostra informações essenciais:
  - Nome
  - Imagem (primeira imagem ou placeholder)
  - Preço
  - Status (Ativo/Inativo) com indicador visual
  - Categoria
- ✅ Lista tem paginação ou scroll infinito
- ✅ Filtros visíveis (por categoria, status, busca)
- ✅ Botão "Novo Produto" visível e destacado
- ✅ Ações rápidas (editar, visualizar, ativar/desativar) acessíveis

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-013: Cadastro de Novo Produto - Fluxo Completo
**Prioridade:** Crítica  
**Descrição:** Verificar se o usuário consegue cadastrar um produto completo.

**Cenário:**
1. Usuário clica em "Novo Produto"
2. Preenche todos os campos obrigatórios:
   - Nome: "Camiseta Básica"
   - Descrição: "Camiseta 100% algodão..."
   - Categoria: Seleciona da lista
   - Preço: 49.90
   - SKU: "CAM-001"
   - Código de barras: "7891234567890"
   - Adiciona imagens (URLs)
   - Define estoque por loja
3. Clica em "Salvar"

**Resultado Esperado:**
- ✅ Formulário abre em modal ou página dedicada
- ✅ Campos obrigatórios marcados visualmente
- ✅ Campo de categoria mostra dropdown com categorias ativas
- ✅ Campo de preço aceita valores decimais
- ✅ Campo de imagens permite adicionar múltiplas (mín. 1, máx. 8)
- ✅ Seção de estoque permite adicionar estoque por loja
- ✅ Validações aparecem em tempo real
- ✅ Botão "Salvar" só habilita quando formulário válido
- ✅ Ao salvar, mostra feedback de sucesso
- ✅ Redireciona para lista ou fecha modal
- ✅ Produto aparece na lista após salvar

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-014: Validações no Cadastro de Produto
**Prioridade:** Alta  
**Descrição:** Verificar se as validações aparecem de forma clara.

**Cenário:**
1. Usuário tenta cadastrar produto sem preencher campos obrigatórios
2. Tenta usar SKU duplicado
3. Tenta adicionar mais de 8 imagens
4. Tenta usar preço promocional maior que preço normal

**Resultado Esperado:**
- ✅ Campos vazios mostram mensagem: "Campo obrigatório"
- ✅ SKU duplicado mostra erro antes de salvar (validação em tempo real)
- ✅ Tentativa de adicionar 9ª imagem mostra erro ou bloqueia
- ✅ Preço promocional maior mostra: "Preço promocional deve ser menor que o preço"
- ✅ Mensagens aparecem próximo ao campo com erro
- ✅ Campos com erro ficam destacados (borda vermelha)
- ✅ Mensagens desaparecem quando erro é corrigido
- ✅ Botão "Salvar" permanece desabilitado enquanto houver erros

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-015: Edição de Produto
**Prioridade:** Crítica  
**Descrição:** Verificar se o usuário consegue editar um produto existente.

**Cenário:**
1. Usuário está na lista de produtos
2. Clica em "Editar" em um produto
3. Modifica alguns campos
4. Clica em "Salvar"

**Resultado Esperado:**
- ✅ Formulário abre pré-preenchido com dados do produto
- ✅ Usuário pode modificar qualquer campo
- ✅ Validações funcionam igual ao cadastro
- ✅ SKU não pode ser alterado (ou apenas com validação especial)
- ✅ Ao salvar, mostra confirmação
- ✅ Alterações são refletidas na lista
- ✅ Log de alteração é registrado

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-016: Visualização de Detalhes do Produto
**Prioridade:** Média  
**Descrição:** Verificar se os detalhes do produto são exibidos claramente.

**Cenário:**
1. Usuário clica em "Ver" ou no nome do produto
2. Observa a página de detalhes

**Resultado Esperado:**
- ✅ Página mostra todas as informações do produto:
  - Nome e descrição
  - Galeria de imagens (todas as imagens)
  - Preço e preço promocional (se houver)
  - SKU e código de barras
  - Categoria
  - Tamanhos e cores disponíveis
  - Estoque por loja (tabela ou cards)
  - Status
  - Datas de criação e atualização
- ✅ Layout organizado e fácil de ler
- ✅ Botões de ação (editar, ativar/desativar, remover) visíveis

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-017: Ativação/Desativação de Produto
**Prioridade:** Alta  
**Descrição:** Verificar se o usuário consegue ativar/desativar produtos facilmente.

**Cenário:**
1. Usuário está na lista de produtos
2. Clica em "Desativar" em um produto ativo
3. Observa mudança de status
4. Tenta ativar um produto inativo

**Resultado Esperado:**
- ✅ Botão de ativar/desativar é visível e claro
- ✅ Ao desativar, mostra confirmação (modal ou toast)
- ✅ Status muda visualmente (cor, badge, etc.)
- ✅ Ao tentar ativar, valida se produto pode ser ativado
- ✅ Se não puder ativar, mostra razões claras:
  - "Produto precisa de pelo menos 1 imagem"
  - "Produto precisa de estoque em loja ativa"
  - "Categoria deve estar ativa"
- ✅ Lista atualiza automaticamente após mudança

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-018: Remoção de Produto
**Prioridade:** Alta  
**Descrição:** Verificar se a remoção de produto tem confirmação adequada.

**Cenário:**
1. Usuário está na lista de produtos
2. Clica em "Remover" em um produto
3. Confirma a remoção

**Resultado Esperado:**
- ✅ Botão de remover é visível mas não destaque (cor de alerta)
- ✅ Ao clicar, abre modal de confirmação
- ✅ Modal mostra:
  - Mensagem clara: "Tem certeza que deseja remover este produto?"
  - Nome do produto
  - Aviso sobre consequências (se houver)
- ✅ Botões "Cancelar" e "Confirmar" claros
- ✅ Se produto não pode ser removido (pedidos em andamento), mostra erro
- ✅ Após remover, produto desaparece da lista
- ✅ Mensagem de sucesso é exibida

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-019: Filtros e Busca na Lista de Produtos
**Prioridade:** Alta  
**Descrição:** Verificar se os filtros funcionam de forma intuitiva.

**Cenário:**
1. Usuário está na lista de produtos
2. Usa filtro por categoria
3. Usa filtro por status
4. Usa busca por nome/SKU

**Resultado Esperado:**
- ✅ Filtros são visíveis e fáceis de usar
- ✅ Dropdown de categorias mostra apenas categorias ativas
- ✅ Filtro por status tem opções: Todos, Ativos, Inativos
- ✅ Busca funciona em tempo real ou ao pressionar Enter
- ✅ Resultados são filtrados imediatamente
- ✅ Filtros ativos são indicados visualmente
- ✅ Botão "Limpar filtros" está disponível
- ✅ Contador mostra quantos produtos estão sendo exibidos

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 4. Testes de Gestão de Categorias

### UX-020: Listagem de Categorias
**Prioridade:** Crítica  
**Descrição:** Verificar se a lista de categorias é exibida de forma clara.

**Cenário:**
1. Usuário acessa a página de categorias
2. Observa a lista de categorias

**Resultado Esperado:**
- ✅ Lista mostra categorias de forma hierárquica (se aplicável)
- ✅ Cada categoria mostra:
  - Nome
  - Descrição (resumida)
  - Status (Ativa/Inativa) com indicador visual
  - Categoria pai (se houver)
- ✅ Hierarquia é indicada visualmente (indentação, ícones, etc.)
- ✅ Botão "Nova Categoria" visível e destacado
- ✅ Ações rápidas (editar, inativar, remover) acessíveis

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-021: Cadastro de Nova Categoria
**Prioridade:** Crítica  
**Descrição:** Verificar se o usuário consegue cadastrar uma categoria.

**Cenário:**
1. Usuário clica em "Nova Categoria"
2. Preenche campos:
   - Nome: "Roupas Femininas"
   - Descrição: "Categoria para roupas do público feminino"
   - Slug: "roupas-femininas" (gerado automaticamente ou manual)
   - Categoria Pai: Seleciona (opcional)
   - Status: Ativa
3. Clica em "Salvar"

**Resultado Esperado:**
- ✅ Formulário é simples e direto
- ✅ Slug é gerado automaticamente a partir do nome (ou pode ser editado)
- ✅ Campo "Categoria Pai" mostra dropdown com categorias ativas
- ✅ Se selecionar categoria pai, mostra hierarquia (ex: "Roupas > Roupas Masculinas")
- ✅ Validações aparecem em tempo real
- ✅ Ao salvar, categoria aparece na lista
- ✅ Se categoria pai foi selecionada, hierarquia é exibida corretamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-022: Validação de Hierarquia de Categorias
**Prioridade:** Alta  
**Descrição:** Verificar se o sistema impede hierarquia inválida.

**Cenário:**
1. Usuário tenta criar categoria nível 4
2. Tenta usar categoria inativa como pai
3. Tenta fazer categoria ser pai de si mesma

**Resultado Esperado:**
- ✅ Ao tentar criar nível 4, mostra erro: "Máximo de 3 níveis hierárquicos permitidos"
- ✅ Dropdown de categoria pai não mostra categorias inativas
- ✅ Se tentar usar categoria inativa, mostra erro
- ✅ Se tentar fazer categoria ser pai de si mesma, mostra erro
- ✅ Mensagens são claras e aparecem no momento certo

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-023: Inativação de Categoria em Cascata
**Prioridade:** Alta  
**Descrição:** Verificar se ao inativar categoria pai, usuário entende o que vai acontecer.

**Cenário:**
1. Usuário tem categoria pai com categorias filhas
2. Clica em "Inativar" na categoria pai
3. Observa confirmação e resultado

**Resultado Esperado:**
- ✅ Ao clicar em "Inativar", mostra modal de confirmação
- ✅ Modal explica claramente:
  - "Ao inativar esta categoria, todas as categorias filhas também serão inativadas"
  - Lista as categorias filhas que serão afetadas
- ✅ Usuário pode confirmar ou cancelar
- ✅ Após confirmar, categoria pai e todas as filhas são inativadas
- ✅ Mudanças são refletidas visualmente na lista
- ✅ Log registra a ação

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-024: Remoção de Categoria com Produtos
**Prioridade:** Alta  
**Descrição:** Verificar se o sistema impede remoção de categoria com produtos.

**Cenário:**
1. Usuário tenta remover categoria que tem produtos associados

**Resultado Esperado:**
- ✅ Ao tentar remover, sistema verifica se há produtos
- ✅ Se houver produtos, mostra erro claro:
  - "Esta categoria não pode ser removida pois possui X produtos associados"
  - Sugere inativar ao invés de remover
- ✅ Botão de remover pode estar desabilitado ou mostrar aviso antes
- ✅ Usuário entende o motivo e sabe o que fazer

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 5. Testes de Gestão de Lojas

### UX-025: Listagem de Lojas
**Prioridade:** Crítica  
**Descrição:** Verificar se a lista de lojas é exibida de forma clara.

**Cenário:**
1. Usuário acessa a página de lojas
2. Observa a lista de lojas

**Resultado Esperado:**
- ✅ Lista mostra lojas em cards ou tabela
- ✅ Cada loja mostra:
  - Nome
  - Tipo (Física/Online) com ícone ou badge
  - Endereço completo (se física)
  - Horário de funcionamento
  - Status (Ativa/Inativa)
- ✅ Lojas físicas mostram endereço formatado
- ✅ Lojas online indicam claramente que são online
- ✅ Botão "Nova Loja" visível e destacado

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-026: Cadastro de Loja Física
**Prioridade:** Crítica  
**Descrição:** Verificar se o usuário consegue cadastrar loja física completa.

**Cenário:**
1. Usuário clica em "Nova Loja"
2. Seleciona tipo "Física"
3. Preenche:
   - Nome: "Loja Centro"
   - Todos os campos de endereço
   - Horário de funcionamento
   - Status: Ativa
4. Clica em "Salvar"

**Resultado Esperado:**
- ✅ Ao selecionar "Física", campos de endereço aparecem/ficam obrigatórios
- ✅ Campos de endereço incluem:
  - Logradouro
  - Número
  - Complemento (opcional)
  - Bairro
  - Cidade
  - Estado (dropdown ou campo)
  - CEP (com máscara)
- ✅ Validação de CEP funciona
- ✅ Campos obrigatórios marcados visualmente
- ✅ Ao salvar, loja aparece na lista com endereço formatado

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-027: Cadastro de Loja Online
**Prioridade:** Média  
**Descrição:** Verificar se o usuário consegue cadastrar loja online.

**Cenário:**
1. Usuário clica em "Nova Loja"
2. Seleciona tipo "Online"
3. Preenche nome e horário
4. Clica em "Salvar"

**Resultado Esperado:**
- ✅ Ao selecionar "Online", campos de endereço desaparecem ou ficam desabilitados
- ✅ Apenas nome, horário e status são obrigatórios
- ✅ Interface deixa claro que endereço não é necessário
- ✅ Ao salvar, loja aparece na lista como "Online"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-028: Validação de Endereço para Loja Física
**Prioridade:** Alta  
**Descrição:** Verificar se validação de endereço funciona corretamente.

**Cenário:**
1. Usuário tenta cadastrar loja física sem preencher endereço
2. Tenta cadastrar com endereço incompleto

**Resultado Esperado:**
- ✅ Se tipo é "Física" e endereço vazio, mostra erro: "Endereço é obrigatório para lojas físicas"
- ✅ Se algum campo de endereço está vazio, mostra quais campos faltam
- ✅ Mensagens aparecem próximo aos campos
- ✅ Botão "Salvar" permanece desabilitado enquanto houver erros

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-029: Remoção de Loja com Estoque
**Prioridade:** Alta  
**Descrição:** Verificar se sistema impede remoção de loja com produtos em estoque.

**Cenário:**
1. Usuário tenta remover loja que tem produtos com estoque

**Resultado Esperado:**
- ✅ Sistema verifica se há estoque antes de permitir remoção
- ✅ Se houver estoque, mostra erro claro:
  - "Esta loja não pode ser removida pois possui produtos com estoque associados"
  - Sugere verificar estoque primeiro
- ✅ Modal de confirmação pode mostrar aviso antes mesmo de tentar

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 6. Testes de Busca e Navegação

### UX-030: Busca Global Funcional
**Prioridade:** Crítica  
**Descrição:** Verificar se busca global funciona de forma intuitiva.

**Cenário:**
1. Usuário digita na barra de busca global
2. Observa resultados aparecendo
3. Clica em um resultado

**Resultado Esperado:**
- ✅ Barra de busca está sempre visível (header ou sidebar)
- ✅ Placeholder indica: "Buscar produtos, categorias, lojas..."
- ✅ Busca funciona com pelo menos 2-3 caracteres
- ✅ Resultados aparecem em dropdown ou página dedicada
- ✅ Resultados são agrupados por tipo (Produtos, Categorias, Lojas)
- ✅ Cada resultado mostra informação relevante (nome, tipo, etc.)
- ✅ Ao clicar, navega para página correspondente
- ✅ Se não houver resultados, mostra mensagem clara
- ✅ Busca é rápida (feedback imediato)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-031: Navegação entre Páginas
**Prioridade:** Crítica  
**Descrição:** Verificar se navegação é intuitiva e consistente.

**Cenário:**
1. Usuário navega entre diferentes páginas do sistema
2. Usa menu de navegação
3. Usa breadcrumbs (se houver)

**Resultado Esperado:**
- ✅ Menu de navegação está sempre visível
- ✅ Menu mostra páginas principais:
  - Dashboard
  - Produtos
  - Categorias
  - Lojas
  - Logs (se aplicável)
- ✅ Página atual está destacada no menu
- ✅ Breadcrumbs mostram localização atual (se implementado)
- ✅ Transições entre páginas são suaves
- ✅ URL reflete a página atual
- ✅ Botão "Voltar" funciona corretamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-032: Feedback Visual de Ações
**Prioridade:** Alta  
**Descrição:** Verificar se o sistema fornece feedback adequado para ações do usuário.

**Cenário:**
1. Usuário salva um produto
2. Usuário remove uma categoria
3. Usuário ativa um produto

**Resultado Esperado:**
- ✅ Ao salvar, mostra mensagem de sucesso (toast/notificação)
- ✅ Mensagem desaparece automaticamente após alguns segundos
- ✅ Ao remover, mostra confirmação antes e sucesso depois
- ✅ Ao ativar/desativar, mudança é imediata e visível
- ✅ Loading/spinner aparece durante operações assíncronas
- ✅ Erros são exibidos de forma clara e não intrusiva
- ✅ Feedback não bloqueia a interface

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## 7. Testes de Responsividade e Acessibilidade

### UX-033: Layout Responsivo - Desktop
**Prioridade:** Alta  
**Descrição:** Verificar se interface funciona bem em desktop.

**Cenário:**
1. Usuário acessa o sistema em tela grande (1920x1080 ou maior)
2. Navega pelas páginas principais

**Resultado Esperado:**
- ✅ Layout utiliza espaço disponível eficientemente
- ✅ Cards e listas são organizados em grid
- ✅ Informações não ficam muito espaçadas
- ✅ Menu lateral ou superior funciona bem
- ✅ Todas as funcionalidades são acessíveis

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-034: Layout Responsivo - Tablet
**Prioridade:** Média  
**Descrição:** Verificar se interface funciona bem em tablet.

**Cenário:**
1. Usuário acessa o sistema em tablet (768px - 1024px)
2. Navega pelas páginas principais

**Resultado Esperado:**
- ✅ Layout se adapta ao tamanho da tela
- ✅ Cards se reorganizam (2 colunas ao invés de 4)
- ✅ Menu pode ser colapsável
- ✅ Formulários são legíveis e usáveis
- ✅ Botões têm tamanho adequado para toque

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-035: Layout Responsivo - Mobile
**Prioridade:** Média  
**Descrição:** Verificar se interface funciona bem em mobile.

**Cenário:**
1. Usuário acessa o sistema em mobile (320px - 767px)
2. Navega pelas páginas principais

**Resultado Esperado:**
- ✅ Layout se adapta completamente
- ✅ Menu vira hamburger menu
- ✅ Cards ficam em coluna única
- ✅ Formulários são usáveis (campos não muito pequenos)
- ✅ Botões têm área de toque adequada (mín. 44x44px)
- ✅ Texto é legível sem zoom
- ✅ Navegação é intuitiva

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-036: Acessibilidade - Navegação por Teclado
**Prioridade:** Média  
**Descrição:** Verificar se sistema é navegável apenas com teclado.

**Cenário:**
1. Usuário navega pelo sistema usando apenas teclado
2. Usa Tab para navegar entre elementos
3. Usa Enter para ativar botões

**Resultado Esperado:**
- ✅ Todos os elementos interativos são acessíveis via Tab
- ✅ Ordem de tabulação é lógica
- ✅ Foco é visível (outline ou highlight)
- ✅ Modais podem ser fechados com ESC
- ✅ Formulários podem ser preenchidos e enviados apenas com teclado
- ✅ Navegação não fica "presa" em nenhum elemento

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-037: Acessibilidade - Contraste e Legibilidade
**Prioridade:** Média  
**Descrição:** Verificar se texto e elementos têm contraste adequado.

**Cenário:**
1. Usuário observa textos e elementos na interface
2. Verifica se são legíveis

**Resultado Esperado:**
- ✅ Texto tem contraste adequado (WCAG AA mínimo)
- ✅ Links são distinguíveis do texto normal
- ✅ Botões têm contraste suficiente
- ✅ Mensagens de erro são visíveis
- ✅ Placeholders não são a única indicação de campos
- ✅ Tamanho de fonte é legível (mín. 14px para corpo)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

### UX-038: Performance Percebida
**Prioridade:** Média  
**Descrição:** Verificar se sistema parece rápido e responsivo.

**Cenário:**
1. Usuário realiza ações no sistema
2. Observa tempo de resposta

**Resultado Esperado:**
- ✅ Páginas carregam em menos de 2-3 segundos
- ✅ Ações mostram feedback imediato (loading)
- ✅ Listas carregam progressivamente (se houver muitos itens)
- ✅ Busca responde rapidamente
- ✅ Não há "travamentos" ou delays longos
- ✅ Animações são suaves (se houver)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou  
**Observações:** 

---

## Resumo de Cobertura de Testes UX

### Total de Casos de Teste: 38

**Por Prioridade:**
- Crítica: 15 casos
- Alta: 15 casos
- Média: 8 casos

**Por Área:**
- Login e Autenticação: 4 casos
- Dashboard: 7 casos
- Gestão de Produtos: 8 casos
- Gestão de Categorias: 5 casos
- Gestão de Lojas: 5 casos
- Busca e Navegação: 3 casos
- Responsividade e Acessibilidade: 6 casos

---

## Como Usar Este Documento

1. **Durante o Desenvolvimento:**
   - Execute os testes conforme desenvolve cada funcionalidade
   - Teste em diferentes navegadores e dispositivos
   - Marque o status de cada teste

2. **Testes Manuais:**
   - Siga os cenários passo a passo
   - Observe comportamentos e feedbacks
   - Anote problemas encontrados

3. **Testes com Usuários Reais:**
   - Use este documento como guia para sessões de teste com usuários
   - Observe onde usuários têm dificuldades
   - Documente feedback adicional

4. **Checklist de Release:**
   - Antes de fazer deploy, execute todos os testes críticos
   - Corrija problemas de UX antes de lançar

---

## Critérios de Sucesso

Um teste é considerado **✅ Passou** quando:
- Todas as expectativas listadas são atendidas
- A experiência é fluida e intuitiva
- Não há confusão ou frustração do usuário
- Feedback é claro e útil

Um teste é considerado **❌ Falhou** quando:
- Qualquer expectativa não é atendida
- Usuário fica confuso ou não consegue completar a ação
- Interface não responde como esperado
- Feedback é insuficiente ou confuso

---

**Última Atualização:** 2024  
**Versão do Documento:** 1.0



