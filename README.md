# NetSheriff

O **NetSheriff** é uma plataforma acadêmica de monitoramento e análise de segurança de rede, com dashboard, alertas, regras de detecção, logs, monitoramento e auditoria real do firewall Linux via `iptables`.

O projeto foi desenvolvido para a disciplina de Programação Web e integra uma interface web com uma API Node.js/Express, banco SQLite via Prisma e autenticação JWT.

## Funcionalidades

- **Dashboard:** visão geral do sistema, métricas principais e resumo dos alertas.
- **Alertas:** alertas do sistema e achados relevantes da auditoria do firewall.
- **Regras:** regras internas de detecção do NetSheriff.
- **Monitoramento:** estado geral da rede/sistema e eventos recentes.
- **Firewall:** auditoria real completa das regras do `iptables`.
- **Logs:** registros e eventos do sistema exibidos nas áreas de monitoramento/segurança.
- **Autenticação:** cadastro, login e proteção de rotas com JWT.

## Tecnologias

- Node.js
- Express.js
- Prisma
- SQLite
- HTML
- CSS
- JavaScript
- JWT
- Docker/Docker Compose
- iptables

## Estrutura Geral do Projeto

```text
NetSheriff/
├── back/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── scripts/
│   ├── src/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── front/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── alerts.html
│   ├── rules.html
│   ├── monitoring.html
│   ├── audit.html
│   └── login.html
└── docker-compose.yml
```

## Rodar com Docker

Na raiz do projeto, execute:

```bash
docker compose up --build
```

O backend ficará disponível em:

```text
http://localhost:3000
```

O frontend ficará disponível em:

```text
http://localhost:8080
```

> Em containers Docker comuns, a auditoria de `iptables` pode aparecer como indisponível, pois o container normalmente não acessa o firewall real do host.

## Rodar Localmente

Para executar o projeto localmente com suporte à auditoria real de `iptables`, rode:

```bash
cd back
npm install
npm run setup:local
npm run setup:iptables
npm start
```

Em outro terminal, sirva o frontend a partir da raiz do projeto:

```bash
python3 -m http.server 5502
```

Acesse no navegador:

```text
http://127.0.0.1:5502/front/index.html
```

O backend ficará disponível em:

```text
http://localhost:3000
```

O script `setup:local` prepara o ambiente local do backend, incluindo banco SQLite, Prisma, migrations, seed e arquivos necessários para execução.

O script `setup:iptables` configura a permissão necessária para a auditoria real do firewall Linux.

## Auditoria Real do iptables

A aba **Firewall** consulta regras reais do firewall Linux usando comandos de leitura do `iptables`.

Para configurar e verificar a auditoria em um ambiente Linux:

```bash
cd back
npm run setup:iptables
npm run check:iptables
```

Essa auditoria:

- lê regras reais do firewall Linux;
- é somente leitura;
- não cria, não altera e não remove regras;
- utiliza comandos controlados no backend;
- não permite comandos enviados pelo usuário;
- depende de Linux com `iptables` e permissão adequada;
- pode aparecer como indisponível se não houver permissão ou se o ambiente estiver isolado, como em Docker comum.

As regras reais do `iptables` aparecem na aba **Firewall** apenas para visualização e auditoria.

A aba **Regras** não representa regras reais do firewall. Ela contém regras internas de detecção do NetSheriff, como regras para identificar port scan, tráfego alto ou anomalias.

## Variáveis de Ambiente

O backend usa variáveis de ambiente para configurar porta, banco de dados e segredo JWT.

Principais variáveis:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `LOG_LEVEL`

O arquivo `.env` real não deve ser enviado ao GitHub.

O arquivo `.env.example` serve como modelo de configuração.

Para uso local, o ambiente é preparado pelo script:

```bash
npm run setup:local
```

Antes de usar fora de demonstrações acadêmicas, altere o `JWT_SECRET` para um valor forte.

## Banco de Dados

O projeto utiliza SQLite com Prisma ORM.

O schema do banco fica em:

```text
back/prisma/schema.prisma
```

As migrations ficam em:

```text
back/prisma/migrations/
```

O seed inicial fica em:

```text
back/prisma/seed.js
```

Comandos úteis:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npx prisma studio
```

O Prisma é usado para realizar operações de criação, consulta, atualização e remoção de dados no backend.

## Autenticação

O sistema possui autenticação com JWT.

Fluxo geral:

1. O usuário realiza cadastro ou login.
2. O backend valida os dados.
3. O backend gera um token JWT.
4. O frontend armazena o token no cliente.
5. As requisições autenticadas enviam o token no header:

```text
Authorization: Bearer <token>
```

Rotas protegidas validam o token antes de permitir acesso aos dados.

As senhas são armazenadas de forma segura com hash, não em texto puro.

## Principais Endpoints

### Autenticação

```text
POST /api/auth/register
POST /api/auth/login
```

### Regras internas de detecção

```text
GET    /api/rules
POST   /api/rules
PUT    /api/rules/:id
PATCH  /api/rules/:id/status
DELETE /api/rules/:id
```

### Alertas

```text
GET /api/alerts
```

### Logs

```text
GET /api/logs
```

### Tráfego / Monitoramento

```text
GET /api/traffic
```

### Auditoria do Firewall

```text
GET /api/audit/iptables
```

A rota de auditoria do firewall retorna dados reais do `iptables`, quando disponíveis, incluindo chains, policies, regras, achados e recomendações.

## Organização das Abas

### Dashboard

Mostra a visão geral do sistema, incluindo métricas principais, alertas recentes, regras rápidas e resumo da auditoria do firewall.

### Alertas

Exibe alertas do sistema e também achados relevantes da auditoria do firewall, como configurações permissivas ou riscos encontrados nas regras do `iptables`.

### Regras

Exibe regras internas de detecção do NetSheriff.

Essas regras pertencem à lógica da aplicação e podem ser cadastradas, editadas, ativadas, desativadas ou removidas pelo usuário.

Elas não são regras reais do `iptables`.

### Monitoramento

Mostra o estado geral da rede/sistema, métricas do painel e eventos recentes.

### Firewall

Exibe a auditoria real completa do `iptables`.

Essa aba mostra:

- status da auditoria;
- risco geral;
- chains;
- policies;
- regras reais;
- achados;
- recomendações.

As regras reais do firewall são apenas lidas e analisadas. O sistema não altera o firewall.

### Logs

Exibe registros e eventos do sistema, incluindo eventos de segurança e logs derivados da auditoria do firewall.

## Segurança

A auditoria do `iptables` foi implementada com foco em segurança:

- os comandos são fixos e controlados no backend;
- o usuário não envia comandos para execução;
- a auditoria é somente leitura;
- nenhuma regra do firewall é criada, alterada ou removida;
- erros de permissão são tratados com mensagens amigáveis;
- segredos e credenciais ficam fora do código-fonte por meio de variáveis de ambiente.

## Docker

O projeto possui configuração Docker para facilitar a execução.

Arquivos principais:

```text
docker-compose.yml
back/Dockerfile
front/Dockerfile
```

Comando principal:

```bash
docker compose up --build
```

O Docker executa o sistema de forma integrada, subindo backend, frontend e banco de dados.

A auditoria real do `iptables` pode exigir execução local ou permissões específicas, pois containers comuns são isolados do firewall real do host.

## Observações para Apresentação

O NetSheriff combina dados demonstrativos do painel com uma integração real ao sistema operacional.

A parte de alertas, logs e monitoramento representa o funcionamento de uma plataforma de segurança.

A parte real implementada é a auditoria do firewall Linux via `iptables`, que lê regras reais da máquina e gera achados de segurança.

A separação entre **Regras** e **Firewall** foi feita por segurança e organização:

- **Regras:** regras internas de detecção do NetSheriff.
- **Firewall:** regras reais do `iptables`, apenas para auditoria e leitura.

Essa separação evita que a aplicação edite diretamente configurações sensíveis do sistema operacional.

## Repositório

O código-fonte do projeto deve ser disponibilizado no GitHub e enviado conforme as orientações da disciplina.
```