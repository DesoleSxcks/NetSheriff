# NetSheriff - Sistema de Monitoramento e Detecção de Intrusão

O **NetSheriff** é uma aplicação Web front-end que atua como o painel de controle de um Sistema de Detecção de Intrusão (IDS) simplificado. Ele permite o monitoramento do tráfego de rede para identificar atividades suspeitas, gerenciar regras de segurança e visualizar alertas gerados pelo sistema.

Este projeto foi desenvolvido como requisito avaliativo da disciplina de Programação Web, aplicando conceitos modernos de manipulação de interfaces e consumo de APIs.

---

## Funcionalidades Principais

* **Dashboard Analítico:** Visão geral da rede, estatísticas de tráfego e resumo dos alertas mais recentes.
* **Gerenciamento de Regras (CRUD):** Criação, leitura, atualização (ativar/desativar e edição) e remoção de regras de detecção de anomalias (ex: detecção de DDoS, Port Scan).
* **Painel de Alertas:** Listagem dinâmica de alertas de segurança com filtros por severidade, tipo de ameaça e período de datas.
 * **Monitoramento Simulado:** Interface dedicada para visualização do tráfego e logs em tempo real.
* **Firewall:** Página dedicada para auditar as regras reais do iptables, com achados de configuração e recomendações.

---

## Tecnologias e Ferramentas Utilizadas

* **HTML5 & CSS3:** Estruturação semântica e estilização do layout.
* **JavaScript (ES6+):** Lógica da aplicação, manipulação do DOM e consumo de API.
* **Bootstrap 4 & SB Admin 2:** Framework CSS e template de dashboard para garantir responsividade e uma excelente UX/UI.
* **JSON Server:** (removido) o projeto agora usa uma API Express com Prisma + SQLite.

---

## Como Executar o Projeto Localmente

O backend agora é uma API Node.js/Express que utiliza Prisma ORM 6 e SQLite. Execute o backend antes de abrir as páginas front-end.

### Auditoria real de iptables
O projeto inclui uma rota read-only para auditar as regras atuais do firewall do host via `iptables-save` e `iptables -L -n -v` quando o backend é executado localmente em Linux.

- Os dados reais vêm das regras atuais do iptables.
- Os alertas exibidos são, em sua maior parte, dados demonstrativos e achados de auditoria — não representam ataques em tempo real.
- A funcionalidade não altera, cria ou remove regras do firewall.
- O backend usa comandos fixos de leitura e não aceita comandos enviados pelo usuário.
- Para usar a auditoria em um PC Linux novo, rode o script de configuração uma vez:
  ```bash
  cd back
  npm install
  npm run setup:iptables
  ```
- Depois disso, o backend pode rodar normalmente com:
  ```bash
  npm start
  ```
- Para verificar se a permissão já está configurada:
  ```bash
  npm run check:iptables
  ```
- Em ambientes Docker comuns, a auditoria pode responder que o recurso está indisponível por isolamento do container.
 - Se não houver permissão administrativa, a tela mostra uma mensagem amigável em vez de quebrar a aplicação.

### Execução local para auditoria real de iptables
```bash
cd back
npm install
npm run setup:local
npm start
```

Se o arquivo `.env` ainda não existir, o comando `npm run setup:local` cria automaticamente a partir de `.env.example`.

### Execução local sem Docker
```bash
cd back
npm install
npm run setup:local
npm start
```

### Servir o frontend localmente
```bash
cd front
python3 -m http.server 8080
```

### Execução normal com Docker
```bash
docker compose up --build
```

O Docker continua sendo o fluxo principal para execução normal do sistema, enquanto a auditoria real de iptables depende do ambiente Linux do host e de permissões adequadas.

> Em containers Docker comuns, a auditoria pode responder que o recurso está indisponível, pois o container não consegue acessar o firewall real do host por padrão.

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

### Sequência recomendada para inicialização rápida

Se você quiser uma sequência única e direta para preparar um novo ambiente (inclui criação de `.env`, migrações e tentativa de configurar permissões do iptables), execute os comandos abaixo na ordem indicada:

```bash
cd back
npm install
npm run setup:local
npm run setup:iptables
npm start
```

Notas:
- `npm run setup:local` cria `back/.env` a partir de `back/.env.example` caso não exista, gera o client do Prisma, aplica migrações e executa o seed do banco.
- `npm run setup:iptables` invoca o script `scripts/setup-iptables-permission.sh` que pode usar `sudo` e requer permissões administrativas em hosts Linux; em ambientes Docker esse passo pode ser desnecessário ou falhar por isolamento do container.
- Não execute `npm run setup:iptables` em um ambiente onde você não tenha certeza das implicações ou permissões; é seguro pular esse passo (a aplicação continuará funcionando sem a auditoria real do iptables).

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
O backend utiliza variáveis definidas em `back/.env`. Há um arquivo `back/.env.example` versionado que mostra as variáveis necessárias:

* `PORT`
* `DATABASE_URL`
* `JWT_SECRET`

Para usar o ambiente local:

1. Copie o arquivo de exemplo para `back/.env`:
   ```bash
   cp back/.env.example back/.env
   ```
2. Altere `JWT_SECRET` para um valor forte e único antes de iniciar o servidor.
3. Se necessário, ajuste `DATABASE_URL` para o caminho do arquivo SQLite.

> `back/.env` está listado em `back/.gitignore` para garantir que credenciais não sejam versionadas.