# Autenticação - NetSheriff

## Visão Geral

O sistema de autenticação foi implementado com:
- **Hashing de Senhas**: Usando scrypt com salt aleatório
- **JWT (JSON Web Token)**: Para autenticação stateless
- **Middleware de Proteção**: Para proteger endpoints
- **Banco de Dados**: Modelo User adicionado ao Prisma

## Endpoints Disponíveis

### Autenticação (Públicos)

#### POST `/api/auth/register`
Registra um novo usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Response (201 Created):**
```json
{
  "message": "Usuário registrado com sucesso",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nome do Usuário"
  }
}
```

#### POST `/api/auth/login`
Faz login de um usuário existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nome do Usuário"
  }
}
```

#### GET `/api/auth/me` (Protegido)
Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nome do Usuário",
  "createdAt": "2026-06-23T20:40:16.000Z"
}
```

### Endpoints Protegidos

Os seguintes endpoints agora requerem autenticação:
- `GET /api/rules` - Listar regras
- `POST /api/rules` - Criar regra
- `GET /api/alerts` - Listar alertas
- `GET /api/logs` - Listar logs
- `GET /api/traffic` - Listar tráfego

## Como Usar

### 1. Registrar um novo usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@netsheriff.com",
    "password": "senha_segura_123",
    "name": "Admin"
  }'
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@netsheriff.com",
    "password": "senha_segura_123"
  }'
```

Você receberá um token JWT que deve ser usado em futuras requisições.

### 3. Usar token em endpoints protegidos

```bash
curl -X GET http://localhost:3000/api/rules \
  -H "Authorization: Bearer <seu_token_aqui>"
```

### 4. Obter informações do usuário autenticado

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <seu_token_aqui>"
```

## Variáveis de Ambiente

Edite o arquivo `.env`:

```env
PORT=3000
DATABASE_URL="file:./data/database.sqlite"
JWT_SECRET="mude_isso_em_producao_com_uma_chave_forte"
```

## Validações

### Registrar
- Email é obrigatório e deve ser único
- Senha deve ter no mínimo 6 caracteres
- Nome é obrigatório

### Login
- Email e senha são obrigatórios
- Retorna erro se as credenciais forem inválidas

### Endpoints Protegidos
- Token JWT é obrigatório no header `Authorization`
- Formato esperado: `Bearer <token>`
- Token expirado ou inválido retorna erro 401

## Segurança

- Senhas são armazenadas com hash usando scrypt + salt aleatório
- Tokens JWT têm expiração de 24 horas
- Comparação de senhas usa `timingSafeEqual` para evitar timing attacks
- Use uma chave JWT_SECRET forte em produção

## Arquivos Criados/Modificados

- **src/lib/auth.js**: Funções de hash e JWT
- **src/lib/authMiddleware.js**: Middleware de proteção
- **src/routes/auth.js**: Rotas de autenticação
- **src/server.js**: Integração de rotas e middleware
- **prisma/schema.prisma**: Modelo User
- **.env**: Variável JWT_SECRET

## Próximos Passos

1. **Frontend**: Atualizar o frontend para armazenar e enviar tokens JWT
2. **Refresh Tokens**: Implementar refresh tokens para melhor segurança
3. **Rate Limiting**: Adicionar rate limiting nas rotas de login/register
4. **Auditoria**: Registrar tentativas de login falhadas
5. **Roles e Permissões**: Adicionar sistema de papéis e permissões específicas
