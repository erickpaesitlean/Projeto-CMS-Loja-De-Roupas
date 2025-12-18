# Documento de Testes - CMS Loja de Roupas

## Informações do Documento
- **Versão:** 1.0
- **Data:** 2024
- **Projeto:** CMS Loja de Roupas
- **Ambiente de Teste:** Desenvolvimento

---

## Índice
1. [Testes da Página Inicial do CMS](#1-testes-da-página-inicial-do-cms)
2. [Testes de Gestão de Categorias](#2-testes-de-gestão-de-categorias)
3. [Testes de Gestão de Produtos](#3-testes-de-gestão-de-produtos)
4. [Testes de Gestão de Lojas](#4-testes-de-gestão-de-lojas)
5. [Testes de Relacionamento Entre Entidades](#5-testes-de-relacionamento-entre-entidades)
6. [Testes de Regras de Negócio](#6-testes-de-regras-de-negócio)
7. [Testes de Autenticação](#7-testes-de-autenticação)

---

## 1. Testes da Página Inicial do CMS

### TC-001: Exibir Cards Resumidos - Total de Produtos
**Prioridade:** Alta  
**Descrição:** Verificar se o card exibe corretamente a quantidade total de produtos cadastrados.

**Pré-condições:**
- Usuário autenticado
- Banco de dados com produtos cadastrados

**Passos:**
1. Acessar a página inicial do CMS (`GET /dashboard/kpis`)
2. Verificar o card "Total de Produtos"

**Resultado Esperado:**
- Card exibe o número correto de produtos cadastrados
- Valor corresponde à contagem total na base de dados
- Card possui ícone e cor corretos

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-002: Exibir Cards Resumidos - Produtos Ativos e Inativos
**Prioridade:** Alta  
**Descrição:** Verificar se os cards exibem corretamente produtos ativos e inativos.

**Pré-condições:**
- Usuário autenticado
- Produtos com status ATIVO e INATIVO cadastrados

**Passos:**
1. Acessar a página inicial do CMS
2. Verificar o card "Produtos Ativos"
3. Verificar o card "Produtos Inativos"

**Resultado Esperado:**
- Card "Produtos Ativos" exibe apenas produtos com status = 'ATIVO'
- Card "Produtos Inativos" exibe apenas produtos com status = 'INATIVO'
- Soma dos dois valores = Total de Produtos

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-003: Exibir Cards Resumidos - Total de Categorias
**Prioridade:** Alta  
**Descrição:** Verificar se o card exibe corretamente a quantidade total de categorias.

**Pré-condições:**
- Usuário autenticado
- Categorias cadastradas

**Passos:**
1. Acessar a página inicial do CMS
2. Verificar o card "Total de Categorias"

**Resultado Esperado:**
- Card exibe o número correto de categorias cadastradas
- Valor corresponde à contagem total na base de dados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-004: Exibir Cards Resumidos - Quantidade de Lojas
**Prioridade:** Alta  
**Descrição:** Verificar se o card exibe corretamente a quantidade de lojas cadastradas.

**Pré-condições:**
- Usuário autenticado
- Lojas cadastradas

**Passos:**
1. Acessar a página inicial do CMS
2. Verificar o card "Lojas Cadastradas"

**Resultado Esperado:**
- Card exibe o número correto de lojas cadastradas
- Valor corresponde à contagem total na base de dados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-005: Exibir Cards Resumidos - Produtos Sem Estoque
**Prioridade:** Alta  
**Descrição:** Verificar se o card exibe corretamente produtos sem estoque.

**Pré-condições:**
- Usuário autenticado
- Produtos com estoque = 0 em todas as lojas

**Passos:**
1. Acessar a página inicial do CMS
2. Verificar o card "Produtos Sem Estoque"

**Resultado Esperado:**
- Card exibe apenas produtos onde a soma de estoquePorLoja = 0
- Valor corresponde à contagem correta na base de dados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-006: Exibir Cards Resumidos - Produtos em Promoção
**Prioridade:** Alta  
**Descrição:** Verificar se o card exibe corretamente produtos com preço promocional ativo.

**Pré-condições:**
- Usuário autenticado
- Produtos ativos com precoPromocional < preco e precoPromocional != null

**Passos:**
1. Acessar a página inicial do CMS
2. Verificar o card "Produtos em Promoção"

**Resultado Esperado:**
- Card exibe apenas produtos ativos onde precoPromocional < preco
- Valor corresponde à contagem correta na base de dados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-007: Busca Global - Produtos
**Prioridade:** Alta  
**Descrição:** Verificar se a busca global encontra produtos por nome, SKU ou código de barras.

**Pré-condições:**
- Usuário autenticado
- Produtos cadastrados

**Passos:**
1. Acessar a busca global (`GET /dashboard/search?termo=camiseta`)
2. Verificar resultados

**Resultado Esperado:**
- Retorna produtos que contenham o termo no nome, SKU ou código de barras
- Busca é case-insensitive
- Retorna no máximo 10 resultados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-008: Busca Global - Categorias
**Prioridade:** Alta  
**Descrição:** Verificar se a busca global encontra categorias por nome.

**Pré-condições:**
- Usuário autenticado
- Categorias cadastradas

**Passos:**
1. Acessar a busca global (`GET /dashboard/search?termo=roupas`)
2. Verificar resultados

**Resultado Esperado:**
- Retorna categorias que contenham o termo no nome
- Busca é case-insensitive
- Retorna no máximo 10 resultados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-009: Busca Global - Lojas
**Prioridade:** Alta  
**Descrição:** Verificar se a busca global encontra lojas por nome.

**Pré-condições:**
- Usuário autenticado
- Lojas cadastradas

**Passos:**
1. Acessar a busca global (`GET /dashboard/search?termo=centro`)
2. Verificar resultados

**Resultado Esperado:**
- Retorna lojas que contenham o termo no nome
- Busca é case-insensitive
- Retorna no máximo 10 resultados

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 2. Testes de Gestão de Categorias

### TC-010: Cadastrar Categoria - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível cadastrar uma nova categoria com todos os campos obrigatórios.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Chamar `POST /categorias` com:
   ```json
   {
     "nome": "Roupas Masculinas",
     "descricao": "Categoria para roupas do público masculino",
     "slug": "roupas-masculinas",
     "categoriaPaiId": null,
     "status": "ATIVA"
   }
   ```

**Resultado Esperado:**
- Status 201 Created
- Categoria criada com ID gerado automaticamente
- Campos createdAt e updatedAt preenchidos
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-011: Cadastrar Categoria - Validação de Campos Obrigatórios
**Prioridade:** Alta  
**Descrição:** Verificar se a API valida campos obrigatórios ao cadastrar categoria.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Chamar `POST /categorias` sem o campo "nome"
2. Chamar `POST /categorias` sem o campo "descricao"
3. Chamar `POST /categorias` sem o campo "slug"
4. Chamar `POST /categorias` sem o campo "status"

**Resultado Esperado:**
- Status 400 Bad Request para cada tentativa
- Mensagem de erro indicando campo obrigatório faltando

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-012: Cadastrar Categoria - Slug Único
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível cadastrar categoria com slug duplicado.

**Pré-condições:**
- Usuário autenticado
- Categoria com slug "roupas-masculinas" já existe

**Passos:**
1. Chamar `POST /categorias` com slug "roupas-masculinas"

**Resultado Esperado:**
- Status 409 Conflict
- Mensagem: "Slug já existe"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-013: Cadastrar Categoria - Hierarquia (Categoria Pai)
**Prioridade:** Média  
**Descrição:** Verificar se é possível cadastrar categoria com categoria pai.

**Pré-condições:**
- Usuário autenticado
- Categoria pai "Roupas Masculinas" cadastrada e ativa

**Passos:**
1. Chamar `POST /categorias` com categoriaPaiId da categoria pai

**Resultado Esperado:**
- Status 201 Created
- Categoria criada com categoriaPaiId correto
- Relacionamento estabelecido corretamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-014: Cadastrar Categoria - Validação de Hierarquia (Máximo 3 Níveis)
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível criar mais de 3 níveis hierárquicos.

**Pré-condições:**
- Usuário autenticado
- Categoria nível 1: "Roupas"
- Categoria nível 2: "Roupas Masculinas" (filha de "Roupas")
- Categoria nível 3: "Camisetas" (filha de "Roupas Masculinas")

**Passos:**
1. Tentar criar categoria nível 4 como filha de "Camisetas"

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Máximo de 3 níveis hierárquicos permitidos"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-015: Cadastrar Categoria - Categoria Pai Deve Estar Ativa
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível usar categoria pai inativa.

**Pré-condições:**
- Usuário autenticado
- Categoria "Roupas" com status INATIVA

**Passos:**
1. Chamar `POST /categorias` com categoriaPaiId da categoria inativa

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Categoria pai deve estar ativa para ser usada"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-016: Cadastrar Categoria - Não Pode Ser Pai de Si Mesma
**Prioridade:** Alta  
**Descrição:** Verificar se categoria não pode ser pai de si mesma.

**Pré-condições:**
- Usuário autenticado
- Categoria "Roupas" com ID 1

**Passos:**
1. Tentar atualizar categoria ID 1 com categoriaPaiId = 1

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Categoria não pode ser pai de si mesma"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-017: Listar Categorias
**Prioridade:** Alta  
**Descrição:** Verificar se é possível listar todas as categorias.

**Pré-condições:**
- Usuário autenticado
- Categorias cadastradas

**Passos:**
1. Chamar `GET /categorias`

**Resultado Esperado:**
- Status 200 OK
- Retorna array com todas as categorias
- Ordenado por nome (ascendente)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-018: Listar Categorias Ativas
**Prioridade:** Alta  
**Descrição:** Verificar se é possível listar apenas categorias ativas.

**Pré-condições:**
- Usuário autenticado
- Categorias ativas e inativas cadastradas

**Passos:**
1. Chamar `GET /categorias/active`

**Resultado Esperado:**
- Status 200 OK
- Retorna apenas categorias com status = 'ATIVA'
- Não retorna categorias inativas

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-019: Buscar Categoria por ID
**Prioridade:** Alta  
**Descrição:** Verificar se é possível buscar uma categoria específica por ID.

**Pré-condições:**
- Usuário autenticado
- Categoria com ID 1 cadastrada

**Passos:**
1. Chamar `GET /categorias/1`

**Resultado Esperado:**
- Status 200 OK
- Retorna categoria com ID 1
- Inclui categoriaPai e categoriasFilhas se existirem

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-020: Buscar Categoria por ID - Não Encontrada
**Prioridade:** Média  
**Descrição:** Verificar tratamento quando categoria não existe.

**Pré-condições:**
- Usuário autenticado
- Categoria com ID 999 não existe

**Passos:**
1. Chamar `GET /categorias/999`

**Resultado Esperado:**
- Status 404 Not Found
- Mensagem: "Categoria não encontrada"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-021: Atualizar Categoria
**Prioridade:** Alta  
**Descrição:** Verificar se é possível atualizar uma categoria existente.

**Pré-condições:**
- Usuário autenticado
- Categoria com ID 1 cadastrada

**Passos:**
1. Chamar `PUT /categorias/1` com dados atualizados

**Resultado Esperado:**
- Status 200 OK
- Categoria atualizada com sucesso
- Campo updatedAt atualizado
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-022: Remover Categoria - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível remover categoria sem produtos associados.

**Pré-condições:**
- Usuário autenticado
- Categoria sem produtos associados

**Passos:**
1. Chamar `DELETE /categorias/1`

**Resultado Esperado:**
- Status 200 OK
- Categoria removida com sucesso
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-023: Remover Categoria - Com Produtos Associados
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível remover categoria com produtos associados.

**Pré-condições:**
- Usuário autenticado
- Categoria com produtos associados

**Passos:**
1. Chamar `DELETE /categorias/1`

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Categoria não pode ser removida pois possui produtos associados"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-024: Inativar Categoria - Cascata
**Prioridade:** Alta  
**Descrição:** Verificar se ao inativar categoria, todas as filhas são inativadas em cascata.

**Pré-condições:**
- Usuário autenticado
- Categoria pai "Roupas" com categorias filhas

**Passos:**
1. Chamar `POST /categorias/1/deactivate`

**Resultado Esperado:**
- Status 200 OK
- Categoria pai inativada
- Todas as categorias filhas inativadas recursivamente
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-025: Buscar Produtos de uma Categoria
**Prioridade:** Média  
**Descrição:** Verificar se é possível buscar produtos associados a uma categoria.

**Pré-condições:**
- Usuário autenticado
- Categoria com produtos associados

**Passos:**
1. Chamar `GET /categorias/1/products`

**Resultado Esperado:**
- Status 200 OK
- Retorna array com produtos da categoria
- Apenas produtos da categoria especificada

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 3. Testes de Gestão de Produtos

### TC-026: Cadastrar Produto - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível cadastrar um novo produto com todos os campos obrigatórios.

**Pré-condições:**
- Usuário autenticado
- Categoria ativa cadastrada
- Loja ativa cadastrada

**Passos:**
1. Chamar `POST /produtos` com todos os campos obrigatórios

**Resultado Esperado:**
- Status 201 Created
- Produto criado com ID gerado automaticamente
- Estoque criado para cada loja especificada
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-027: Cadastrar Produto - Validação de Campos Obrigatórios
**Prioridade:** Alta  
**Descrição:** Verificar validação de campos obrigatórios.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar produto sem nome
2. Tentar cadastrar produto sem descrição
3. Tentar cadastrar produto sem categoriaId
4. Tentar cadastrar produto sem SKU
5. Tentar cadastrar produto sem código de barras
6. Tentar cadastrar produto sem preço
7. Tentar cadastrar produto sem imagens

**Resultado Esperado:**
- Status 400 Bad Request para cada tentativa
- Mensagem de erro indicando campo obrigatório faltando

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-028: Cadastrar Produto - SKU Único
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível cadastrar produto com SKU duplicado.

**Pré-condições:**
- Usuário autenticado
- Produto com SKU "PROD-001" já existe

**Passos:**
1. Tentar cadastrar produto com SKU "PROD-001"

**Resultado Esperado:**
- Status 409 Conflict
- Mensagem: "SKU já existe"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-029: Cadastrar Produto - Código de Barras Único
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível cadastrar produto com código de barras duplicado.

**Pré-condições:**
- Usuário autenticado
- Produto com código de barras "7891234567890" já existe

**Passos:**
1. Tentar cadastrar produto com código de barras "7891234567890"

**Resultado Esperado:**
- Status 409 Conflict
- Mensagem: "Código de barras já existe"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-030: Cadastrar Produto - Validação de Imagens (Mínimo 1)
**Prioridade:** Alta  
**Descrição:** Verificar se é obrigatório ter pelo menos 1 imagem.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar produto com array de imagens vazio

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem indicando que pelo menos 1 imagem é obrigatória

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-031: Cadastrar Produto - Validação de Imagens (Máximo 8)
**Prioridade:** Média  
**Descrição:** Verificar se não é possível cadastrar produto com mais de 8 imagens.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar produto com 9 imagens

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Máximo de 8 imagens permitidas"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-032: Cadastrar Produto - Categoria Deve Estar Ativa
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível associar produto a categoria inativa.

**Pré-condições:**
- Usuário autenticado
- Categoria com status INATIVA

**Passos:**
1. Tentar cadastrar produto com categoriaId da categoria inativa

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Categoria deve estar ativa"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-033: Cadastrar Produto - Preço Promocional Menor que Preço
**Prioridade:** Alta  
**Descrição:** Verificar se preço promocional deve ser menor que preço normal.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar produto com preco = 100 e precoPromocional = 150

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Preço promocional deve ser menor que o preço"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-034: Cadastrar Produto - Estoque em Loja Ativa
**Prioridade:** Alta  
**Descrição:** Verificar se estoque só pode ser cadastrado em lojas ativas.

**Pré-condições:**
- Usuário autenticado
- Loja com status INATIVA

**Passos:**
1. Tentar cadastrar produto com estoque na loja inativa

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Loja deve estar ativa"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-035: Listar Produtos
**Prioridade:** Alta  
**Descrição:** Verificar se é possível listar todos os produtos.

**Pré-condições:**
- Usuário autenticado
- Produtos cadastrados

**Passos:**
1. Chamar `GET /produtos`

**Resultado Esperado:**
- Status 200 OK
- Retorna array com todos os produtos
- Cada produto inclui estoquePorLoja transformado corretamente
- Ordenado por nome (ascendente)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-036: Listar Produtos - Filtro por Categoria
**Prioridade:** Média  
**Descrição:** Verificar filtro de produtos por categoria.

**Pré-condições:**
- Usuário autenticado
- Produtos em diferentes categorias

**Passos:**
1. Chamar `GET /produtos?categoriaId=1`

**Resultado Esperado:**
- Status 200 OK
- Retorna apenas produtos da categoria especificada

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-037: Listar Produtos - Filtro por Status
**Prioridade:** Média  
**Descrição:** Verificar filtro de produtos por status.

**Pré-condições:**
- Usuário autenticado
- Produtos ativos e inativos

**Passos:**
1. Chamar `GET /produtos?status=ATIVO`

**Resultado Esperado:**
- Status 200 OK
- Retorna apenas produtos com status ATIVO

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-038: Listar Produtos - Busca por Termo
**Prioridade:** Média  
**Descrição:** Verificar busca de produtos por nome, SKU ou código de barras.

**Pré-condições:**
- Usuário autenticado
- Produtos cadastrados

**Passos:**
1. Chamar `GET /produtos?search=camiseta`

**Resultado Esperado:**
- Status 200 OK
- Retorna produtos que contenham "camiseta" no nome, SKU ou código de barras
- Busca case-insensitive

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-039: Buscar Produto por ID
**Prioridade:** Alta  
**Descrição:** Verificar se é possível buscar produto específico por ID.

**Pré-condições:**
- Usuário autenticado
- Produto com ID 1 cadastrado

**Passos:**
1. Chamar `GET /produtos/1`

**Resultado Esperado:**
- Status 200 OK
- Retorna produto com ID 1
- Inclui categoria e estoques por loja

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-040: Validar SKU Único
**Prioridade:** Média  
**Descrição:** Verificar endpoint de validação de SKU único.

**Pré-condições:**
- Usuário autenticado
- Produto com SKU "PROD-001" existe

**Passos:**
1. Chamar `GET /produtos/validate-sku?sku=PROD-001`
2. Chamar `GET /produtos/validate-sku?sku=PROD-999`

**Resultado Esperado:**
- Para SKU existente: `{ "isUnique": false }`
- Para SKU novo: `{ "isUnique": true }`

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-041: Validar Se Produto Pode Ser Ativado
**Prioridade:** Alta  
**Descrição:** Verificar validação de ativação de produto.

**Pré-condições:**
- Usuário autenticado
- Produto com todos os campos obrigatórios preenchidos
- Produto com pelo menos 1 imagem
- Produto com categoria ativa
- Produto com estoque > 0 em loja ativa

**Passos:**
1. Chamar `GET /produtos/1/can-activate`

**Resultado Esperado:**
- Status 200 OK
- Retorna `{ "canActivate": true, "reasons": [] }`

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-042: Validar Se Produto NÃO Pode Ser Ativado - Sem Imagem
**Prioridade:** Alta  
**Descrição:** Verificar se produto sem imagem não pode ser ativado.

**Pré-condições:**
- Usuário autenticado
- Produto sem imagens cadastradas

**Passos:**
1. Chamar `GET /produtos/1/can-activate`

**Resultado Esperado:**
- Status 200 OK
- Retorna `{ "canActivate": false, "reasons": ["Pelo menos 1 imagem deve estar cadastrada"] }`

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-043: Validar Se Produto NÃO Pode Ser Ativado - Sem Estoque
**Prioridade:** Alta  
**Descrição:** Verificar se produto sem estoque em loja ativa não pode ser ativado.

**Pré-condições:**
- Usuário autenticado
- Produto sem estoque em lojas ativas

**Passos:**
1. Chamar `GET /produtos/1/can-activate`

**Resultado Esperado:**
- Status 200 OK
- Retorna `{ "canActivate": false, "reasons": ["Deve ter estoque > 0 em pelo menos uma loja com status ATIVA"] }`

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-044: Atualizar Produto
**Prioridade:** Alta  
**Descrição:** Verificar se é possível atualizar produto existente.

**Pré-condições:**
- Usuário autenticado
- Produto com ID 1 cadastrado

**Passos:**
1. Chamar `PUT /produtos/1` com dados atualizados

**Resultado Esperado:**
- Status 200 OK
- Produto atualizado com sucesso
- Estoque atualizado se fornecido
- Campo updatedAt atualizado
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-045: Remover Produto - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível remover produto.

**Pré-condições:**
- Usuário autenticado
- Produto sem pedidos em andamento

**Passos:**
1. Chamar `DELETE /produtos/1`

**Resultado Esperado:**
- Status 200 OK
- Produto removido com sucesso
- Estoques relacionados removidos (cascade)
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 4. Testes de Gestão de Lojas

### TC-046: Cadastrar Loja Física - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível cadastrar loja física com endereço completo.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Chamar `POST /lojas` com tipo FISICA e endereço completo

**Resultado Esperado:**
- Status 201 Created
- Loja criada com ID gerado automaticamente
- Endereço salvo corretamente
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-047: Cadastrar Loja Física - Endereço Obrigatório
**Prioridade:** Alta  
**Descrição:** Verificar se endereço é obrigatório para lojas físicas.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar loja física sem endereço

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Endereço é obrigatório para lojas físicas"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-048: Cadastrar Loja Física - Campos de Endereço Obrigatórios
**Prioridade:** Alta  
**Descrição:** Verificar se todos os campos do endereço são obrigatórios para lojas físicas.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Tentar cadastrar loja física com endereço incompleto (sem bairro, por exemplo)

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Todos os campos do endereço são obrigatórios para lojas físicas"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-049: Cadastrar Loja Online - Sem Endereço
**Prioridade:** Média  
**Descrição:** Verificar se loja online não precisa de endereço.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Chamar `POST /lojas` com tipo ONLINE e sem endereço

**Resultado Esperado:**
- Status 201 Created
- Loja criada sem endereço
- Endereço = null

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-050: Listar Lojas
**Prioridade:** Alta  
**Descrição:** Verificar se é possível listar todas as lojas.

**Pré-condições:**
- Usuário autenticado
- Lojas cadastradas

**Passos:**
1. Chamar `GET /lojas`

**Resultado Esperado:**
- Status 200 OK
- Retorna array com todas as lojas
- Lojas físicas com endereço formatado corretamente
- Lojas online com endereço = null
- Ordenado por nome (ascendente)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-051: Listar Lojas Ativas
**Prioridade:** Alta  
**Descrição:** Verificar se é possível listar apenas lojas ativas.

**Pré-condições:**
- Usuário autenticado
- Lojas ativas e inativas cadastradas

**Passos:**
1. Chamar `GET /lojas/active`

**Resultado Esperado:**
- Status 200 OK
- Retorna apenas lojas com status = 'ATIVA'

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-052: Buscar Loja por ID
**Prioridade:** Alta  
**Descrição:** Verificar se é possível buscar loja específica por ID.

**Pré-condições:**
- Usuário autenticado
- Loja com ID 1 cadastrada

**Passos:**
1. Chamar `GET /lojas/1`

**Resultado Esperado:**
- Status 200 OK
- Retorna loja com ID 1
- Endereço formatado corretamente se for loja física

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-053: Atualizar Loja
**Prioridade:** Alta  
**Descrição:** Verificar se é possível atualizar loja existente.

**Pré-condições:**
- Usuário autenticado
- Loja com ID 1 cadastrada

**Passos:**
1. Chamar `PUT /lojas/1` com dados atualizados

**Resultado Esperado:**
- Status 200 OK
- Loja atualizada com sucesso
- Campo updatedAt atualizado
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-054: Remover Loja - Sucesso
**Prioridade:** Alta  
**Descrição:** Verificar se é possível remover loja sem produtos com estoque.

**Pré-condições:**
- Usuário autenticado
- Loja sem produtos com estoque associados

**Passos:**
1. Chamar `DELETE /lojas/1`

**Resultado Esperado:**
- Status 200 OK
- Loja removida com sucesso
- Log criado automaticamente

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-055: Remover Loja - Com Produtos com Estoque
**Prioridade:** Alta  
**Descrição:** Verificar se não é possível remover loja com produtos com estoque.

**Pré-condições:**
- Usuário autenticado
- Loja com produtos que possuem estoque

**Passos:**
1. Chamar `DELETE /lojas/1`

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Loja não pode ser removida pois possui produtos com estoque associados"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-056: Buscar Produtos de uma Loja
**Prioridade:** Média  
**Descrição:** Verificar se é possível buscar produtos com estoque em uma loja específica.

**Pré-condições:**
- Usuário autenticado
- Loja com produtos que possuem estoque

**Passos:**
1. Chamar `GET /lojas/1/products`

**Resultado Esperado:**
- Status 200 OK
- Retorna apenas produtos com estoque > 0 na loja especificada

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 5. Testes de Relacionamento Entre Entidades

### TC-057: Produto Deve Estar Vinculado a Categoria Ativa
**Prioridade:** Alta  
**Descrição:** Verificar se produto só pode ser associado a categoria ativa.

**Pré-condições:**
- Usuário autenticado
- Categoria inativa

**Passos:**
1. Tentar cadastrar produto com categoriaId da categoria inativa

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Categoria deve estar ativa"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-058: Produto Deve Ter Estoque em Loja Ativa
**Prioridade:** Alta  
**Descrição:** Verificar se produto só pode ter estoque em lojas ativas.

**Pré-condições:**
- Usuário autenticado
- Loja inativa

**Passos:**
1. Tentar cadastrar produto com estoque em loja inativa

**Resultado Esperado:**
- Status 400 Bad Request
- Mensagem: "Loja deve estar ativa"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-059: Estoque Controlado por Loja
**Prioridade:** Alta  
**Descrição:** Verificar se estoque é controlado individualmente por loja.

**Pré-condições:**
- Usuário autenticado
- Produto cadastrado
- 2 lojas cadastradas

**Passos:**
1. Cadastrar produto com estoque diferente em cada loja
2. Verificar estoque por loja

**Resultado Esperado:**
- Produto possui estoque individual por loja
- Estoque de uma loja não afeta estoque de outra

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-060: Hierarquia de Categorias (3 Níveis)
**Prioridade:** Alta  
**Descrição:** Verificar se hierarquia de categorias funciona corretamente até 3 níveis.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Criar categoria nível 1: "Roupas"
2. Criar categoria nível 2: "Roupas Masculinas" (filha de "Roupas")
3. Criar categoria nível 3: "Camisetas" (filha de "Roupas Masculinas")
4. Verificar relacionamentos

**Resultado Esperado:**
- Todas as categorias criadas com sucesso
- Relacionamentos hierárquicos corretos
- Não é possível criar nível 4

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 6. Testes de Regras de Negócio

### TC-061: Produto Sem Estoque Não Pode Ser Exibido como Disponível
**Prioridade:** Alta  
**Descrição:** Verificar regra de negócio sobre produtos sem estoque.

**Pré-condições:**
- Usuário autenticado
- Produto com estoque = 0 em todas as lojas

**Passos:**
1. Verificar produto sem estoque
2. Verificar se status deve ser INATIVO ou se há validação especial

**Resultado Esperado:**
- Produto sem estoque não pode ser ativado
- Validação impede ativação se não houver estoque em loja ativa

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-062: Produto Ativo Deve Ter Imagem e Categoria Ativa
**Prioridade:** Alta  
**Descrição:** Verificar regra de ativação de produto.

**Pré-condições:**
- Usuário autenticado
- Produto com todos os requisitos para ativação

**Passos:**
1. Verificar se produto pode ser ativado (`GET /produtos/1/can-activate`)
2. Ativar produto

**Resultado Esperado:**
- Produto só pode ser ativado se tiver:
  - Pelo menos 1 imagem
  - Categoria ativa
  - Estoque > 0 em loja ativa

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-063: Categorias Inativas Não Podem Ser Selecionadas
**Prioridade:** Alta  
**Descrição:** Verificar se categorias inativas não aparecem na lista de seleção.

**Pré-condições:**
- Usuário autenticado
- Categorias ativas e inativas cadastradas

**Passos:**
1. Chamar `GET /categorias/active`
2. Tentar usar categoria inativa em produto

**Resultado Esperado:**
- Endpoint retorna apenas categorias ativas
- Tentativa de usar categoria inativa retorna erro

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-064: Preço Promocional e Cálculo de Desconto
**Prioridade:** Média  
**Descrição:** Verificar se preço promocional é menor que preço normal.

**Pré-condições:**
- Usuário autenticado
- Produto com preço e preço promocional

**Passos:**
1. Cadastrar produto com preco = 100 e precoPromocional = 80
2. Verificar dados retornados

**Resultado Esperado:**
- Produto cadastrado com sucesso
- precoPromocional < preco
- Dados retornados corretamente para cálculo de desconto no frontend

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-065: Remover Loja Remove Estoques Relacionados
**Prioridade:** Alta  
**Descrição:** Verificar se ao remover loja, estoques são removidos sem afetar outras lojas.

**Pré-condições:**
- Usuário autenticado
- Produto com estoque em 2 lojas diferentes
- Loja 1 sem produtos com estoque

**Passos:**
1. Verificar estoque do produto em ambas as lojas
2. Remover loja 1
3. Verificar estoque do produto na loja 2

**Resultado Esperado:**
- Loja 1 removida com sucesso
- Estoque do produto na loja 1 removido (cascade)
- Estoque do produto na loja 2 mantido

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-066: SKU Único por Produto
**Prioridade:** Alta  
**Descrição:** Verificar se SKU é único no sistema.

**Pré-condições:**
- Usuário autenticado
- Produto com SKU "PROD-001" existe

**Passos:**
1. Tentar criar produto com SKU "PROD-001"
2. Tentar atualizar outro produto com SKU "PROD-001"

**Resultado Esperado:**
- Ambos retornam erro 409 Conflict
- Mensagem: "SKU já existe"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-067: Inativar Categoria Pai Inativa Filhas
**Prioridade:** Alta  
**Descrição:** Verificar se ao inativar categoria pai, filhas são inativadas automaticamente.

**Pré-condições:**
- Usuário autenticado
- Categoria pai com categorias filhas

**Passos:**
1. Inativar categoria pai (`POST /categorias/1/deactivate`)
2. Verificar status das categorias filhas

**Resultado Esperado:**
- Categoria pai inativada
- Todas as categorias filhas inativadas recursivamente
- Log criado

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-068: Log de Alterações
**Prioridade:** Alta  
**Descrição:** Verificar se todas as alterações são registradas em log.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Criar produto
2. Atualizar produto
3. Criar categoria
4. Verificar logs (`GET /logs`)

**Resultado Esperado:**
- Logs criados para cada operação
- Logs contêm: tipo, entidade, descrição, dataHora
- Logs podem ser filtrados por entidade, tipo, usuário, data

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-069: Validação de Imagens (Formato e Tamanho)
**Prioridade:** Média  
**Descrição:** Verificar validação de formato e tamanho de imagens.

**Nota:** Esta validação deve ser implementada no frontend ou em endpoint de upload. Por enquanto, apenas URLs são aceitas.

**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Verificar se há validação de formato de URL
2. Verificar se há validação de tamanho (se implementado)

**Resultado Esperado:**
- URLs válidas são aceitas
- Validação de formato e tamanho (se implementada)

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## 7. Testes de Autenticação

### TC-070: Login com Credenciais Válidas
**Prioridade:** Alta  
**Descrição:** Verificar se login funciona com credenciais válidas.

**Pré-condições:**
- Usuário gerente criado na seed

**Passos:**
1. Chamar `POST /auth/login` com:
   ```json
   {
     "email": "gerente1@loja.com",
     "senha": "123456"
   }
   ```

**Resultado Esperado:**
- Status 200 OK
- Retorna `{ "success": true, "colaborador": {...}, "token": "..." }`
- Token JWT válido

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-071: Login com Email Inválido
**Prioridade:** Alta  
**Descrição:** Verificar tratamento de email inválido.

**Pré-condições:**
- Nenhuma

**Passos:**
1. Chamar `POST /auth/login` com email inexistente

**Resultado Esperado:**
- Status 401 Unauthorized
- Mensagem: "Usuário não encontrado"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-072: Login com Senha Inválida
**Prioridade:** Alta  
**Descrição:** Verificar tratamento de senha inválida.

**Pré-condições:**
- Usuário gerente criado

**Passos:**
1. Chamar `POST /auth/login` com senha incorreta

**Resultado Esperado:**
- Status 401 Unauthorized
- Mensagem: "Senha inválida"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-073: Login com Usuário Inativo
**Prioridade:** Alta  
**Descrição:** Verificar tratamento de usuário inativo.

**Pré-condições:**
- Usuário com status 'inativo'

**Passos:**
1. Chamar `POST /auth/login` com usuário inativo

**Resultado Esperado:**
- Status 401 Unauthorized
- Mensagem: "Usuário inativo"

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

### TC-074: Validação de Campos de Login
**Prioridade:** Média  
**Descrição:** Verificar validação de campos obrigatórios no login.

**Pré-condições:**
- Nenhuma

**Passos:**
1. Tentar login sem email
2. Tentar login sem senha
3. Tentar login com email inválido (formato)

**Resultado Esperado:**
- Status 400 Bad Request para cada tentativa
- Mensagens de validação apropriadas

**Status:** ⬜ Não Testado | ✅ Passou | ❌ Falhou

---

## Resumo de Cobertura de Testes

### Total de Casos de Teste: 74

**Por Prioridade:**
- Alta: 58 casos
- Média: 16 casos

**Por Módulo:**
- Página Inicial: 9 casos
- Gestão de Categorias: 16 casos
- Gestão de Produtos: 20 casos
- Gestão de Lojas: 11 casos
- Relacionamento Entre Entidades: 4 casos
- Regras de Negócio: 9 casos
- Autenticação: 5 casos

---

## Como Usar Este Documento

1. **Durante o Desenvolvimento:**
   - Execute os testes conforme implementa cada funcionalidade
   - Marque o status de cada teste (✅ Passou | ❌ Falhou | ⬜ Não Testado)

2. **Antes de Deploy:**
   - Execute todos os testes de prioridade ALTA
   - Corrija falhas antes de fazer deploy

3. **Após Deploy:**
   - Execute todos os testes para validar ambiente de produção

4. **Registro de Problemas:**
   - Para testes que falharam, documente:
     - Erro encontrado
     - Passos para reproduzir
     - Screenshots/logs (se aplicável)

---

## Notas Importantes

- Alguns testes podem requerer dados específicos no banco
- Testes de integração podem requerer ambiente isolado
- Testes de performance não estão incluídos neste documento
- Testes de segurança (SQL injection, XSS, etc.) devem ser feitos separadamente

---

**Última Atualização:** 2024  
**Versão do Documento:** 1.0



