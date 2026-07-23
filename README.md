# Venda 3D — Backend

API do sistema de controle de estoque/vendas/precificação para impressão 3D.

## Stack
- Node.js + Express
- PostgreSQL (hospedado no [Neon](https://neon.tech))
- Deploy: Vercel (funções serverless em `/api`)
- Autenticação: JWT (feita à mão, sem serviço terceiro)

## Passo a passo pra rodar local

### 1. Criar o banco no Neon
1. Crie uma conta grátis em https://neon.tech
2. Crie um novo projeto (ex: `venda3d`)
3. Copie a **connection string** (algo como `postgresql://usuario:senha@ep-xxxx.neon.tech/venda3d?sslmode=require`)

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` e cole:
- `DATABASE_URL`: a connection string do Neon
- `JWT_SECRET`: gere uma com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `INVITE_CODE`: combine um código qualquer com seu irmão

### 3. Instalar dependências
```bash
npm install
```

### 4. Criar as tabelas no banco
```bash
npm run db:migrate
```
Isso roda o `backend/db/schema.sql` contra o Neon e já popula os tipos de filamento (PLA/ABS/PETG), canais de venda e itens de embalagem padrão.

### 5. Rodar o servidor local
```bash
npm run dev
```
A API sobe em `http://localhost:3001`. Teste com:
```bash
curl http://localhost:3001/api/health
```

### 6. Criar os 2 usuários (você e seu irmão)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Seu Nome","email":"voce@email.com","password":"senha-forte-aqui","inviteCode":"o-codigo-do-.env"}'
```
Repita trocando os dados para seu irmão. Guarde o `token` retornado — ou faça login depois em `/api/auth/login`.

## Rotas principais

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/register` | Cria usuário |
| POST | `/api/auth/login` | Login, retorna token JWT |
| GET | `/api/filament-types` | Lista tipos de filamento (PLA/ABS/PETG) |
| POST | `/api/filament-types` | Cria novo tipo de filamento |
| GET/PUT | `/api/settings` | Parâmetros gerais (energia, impressora, etc.) |
| GET/POST/PUT/DELETE | `/api/channels` | Canais de venda |
| GET/POST/PUT/DELETE | `/api/packaging` | Itens de embalagem |
| POST | `/api/products/calc` | Calcula custo **sem salvar** (pré-visualização) |
| GET/POST/PUT/DELETE | `/api/products` | Produtos cadastrados |
| GET/POST/DELETE | `/api/sales` | Vendas registradas |
| GET | `/api/dashboard` | Totais agregados (faturamento, lucro, etc.) |

Todas as rotas (exceto `/api/health`, `/api/auth/register` e `/api/auth/login`) exigem o header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

## Deploy na Vercel
1. Suba este projeto pro GitHub
2. Importe o repositório na Vercel
3. Em **Environment Variables**, adicione `DATABASE_URL`, `JWT_SECRET` e `INVITE_CODE` (as mesmas do `.env`)
4. Deploy. O `vercel.json` já está configurado pra rotear `/api/*` pra função serverless em `api/index.js`.

## Front-end (React + Vite)

Está em `frontend/`. Telas: Login/Cadastro, Calculadora (com seletor PLA/ABS/PETG), Produtos, Vendas, Dashboard e Configurações.

### Rodar local
Em um terminal **separado** do backend (deixe o backend rodando com `npm run dev` na raiz):
```bash
cd frontend
npm install
npm run dev
```
Abre em `http://localhost:3000`. O `vite.config.js` já redireciona `/api/*` pro backend em `localhost:3001`, então não precisa configurar URL nenhuma.

Crie sua conta / faça login pela própria tela agora — não precisa mais usar o Postman pra isso (mas continua útil pra testar a API diretamente se algo não funcionar na tela).

### Deploy (front + back juntos na Vercel)
O `vercel.json` na raiz já está configurado para:
1. Rodar `cd frontend && npm install && npm run build`
2. Servir o resultado (`frontend/dist`) como o site
3. Rotear `/api/*` pra função serverless em `api/index.js`

Ou seja: um único projeto na Vercel, um único deploy, exatamente como você fez antes. Só não esqueça de configurar `DATABASE_URL`, `JWT_SECRET` e `INVITE_CODE` nas Environment Variables do projeto na Vercel (mesmos valores do seu `.env` local).

## Próximos passos possíveis
- Editar/registrar itens de embalagem pela tela (hoje só existe via API)
- Filtros de data no histórico de vendas e no dashboard
- Exportar relatórios (CSV/PDF)
- Tela de edição de produtos (hoje só cria e remove)
