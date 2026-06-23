# NetSheriff - Sistema de Monitoramento e Detecção de Intrusão

O **NetSheriff** é uma aplicação Web front-end que atua como o painel de controle de um Sistema de Detecção de Intrusão (IDS) simplificado. Ele permite o monitoramento do tráfego de rede para identificar atividades suspeitas, gerenciar regras de segurança e visualizar alertas gerados pelo sistema.

Este projeto foi desenvolvido como requisito avaliativo da disciplina de Programação Web, aplicando conceitos modernos de manipulação de interfaces e consumo de APIs.

---

## Funcionalidades Principais

* **Dashboard Analítico:** Visão geral da rede, estatísticas de tráfego e resumo dos alertas mais recentes.
* **Gerenciamento de Regras (CRUD):** Criação, leitura, atualização (ativar/desativar e edição) e remoção de regras de detecção de anomalias (ex: detecção de DDoS, Port Scan).
* **Painel de Alertas:** Listagem dinâmica de alertas de segurança com filtros por severidade, tipo de ameaça e período de datas.
* **Monitoramento Simulado:** Interface dedicada para visualização do tráfego e logs em tempo real.

---

## Tecnologias e Ferramentas Utilizadas

* **HTML5 & CSS3:** Estruturação semântica e estilização do layout.
* **JavaScript (ES6+):** Lógica da aplicação, manipulação do DOM e consumo de API.
* **Bootstrap 4 & SB Admin 2:** Framework CSS e template de dashboard para garantir responsividade e uma excelente UX/UI.
* **JSON Server:** (removido) o projeto agora usa uma API Express com Prisma + SQLite.

---

## Como Executar o Projeto Localmente

O backend agora é uma API Node.js/Express que utiliza Prisma ORM 6 e SQLite. Execute o backend antes de abrir as páginas front-end.

### Pré-requisitos
* Ter o [Node.js](https://nodejs.org/) instalado na máquina.
* Recomendado: Extensão Live Server no VS Code para servir os arquivos em `front/`.

### Passo a passo (backend)
1. Entre na pasta do backend e instale as dependências:
   ```bash
   cd back
   npm install
   ```
2. Gere o client Prisma, aplique a migração inicial e rode o seed:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
3. Inicie o servidor de desenvolvimento (Express):
   ```bash
   npm run dev
   ```

### Frontend
Abra os arquivos HTML em `front/` (ou use Live Server). O frontend consome a API em `http://localhost:3000/api`.

### Docker (opcional)
Há suporte básico para execução com Docker Compose. No repositório há `docker-compose.yml` que cria os serviços `back` e `front` e um volume persistente para o arquivo SQLite.

Exemplo para subir os serviços:
```bash
docker-compose up --build
```

O backend ficará disponível em `http://localhost:3000` e o front em `http://localhost:8080`.

### Variáveis de ambiente
O backend utiliza variáveis definidas em `.env`. Para referência há um arquivo de exemplo em `back/.env.example` com as variáveis necessárias (DATABASE_URL, PORT, LOG_LEVEL, JWT_SECRET).