# 🛡️ NetSheriff - Sistema de Monitoramento e Detecção de Intrusão

O **NetSheriff** é uma aplicação Web front-end que atua como o painel de controle de um Sistema de Detecção de Intrusão (IDS) simplificado. Ele permite o monitoramento do tráfego de rede para identificar atividades suspeitas, gerenciar regras de segurança e visualizar alertas gerados pelo sistema.

Este projeto foi desenvolvido como requisito avaliativo da disciplina de Programação Web, aplicando conceitos modernos de manipulação de interfaces e consumo de APIs.

---

## 🚀 Funcionalidades Principais

* **Dashboard Analítico:** Visão geral da rede, estatísticas de tráfego e resumo dos alertas mais recentes.
* **Gerenciamento de Regras (CRUD):** Criação, leitura, atualização (ativar/desativar e edição) e remoção de regras de detecção de anomalias (ex: detecção de DDoS, Port Scan).
* **Painel de Alertas:** Listagem dinâmica de alertas de segurança com filtros por severidade, tipo de ameaça e período de datas.
* **Monitoramento Simulado:** Interface dedicada para visualização do tráfego e logs em tempo real.

---

## 🛠️ Tecnologias e Ferramentas Utilizadas

* **HTML5 & CSS3:** Estruturação semântica e estilização do layout.
* **JavaScript (ES6+):** Lógica da aplicação, manipulação do DOM e consumo de API.
* **Bootstrap 4 & SB Admin 2:** Framework CSS e template de dashboard para garantir responsividade e uma excelente UX/UI.
* **JSON Server:** Ferramenta utilizada para simular uma API RESTful (Back-end fake) e persistir os dados localmente no formato JSON.

---

## ⚙️ Como Executar o Projeto Localmente

Como a aplicação consome dados de uma API, é necessário iniciar o servidor local (`json-server`) antes de abrir as páginas HTML. Siga os passos abaixo:

### Pré-requisitos
* Ter o [Node.js](https://nodejs.org/) instalado na máquina.
* Recomendado: Extensão *Live Server* no VS Code.

### Passo a passo
1. Clone este repositório para a sua máquina:
   ```bash
   git clone [https://github.com/SeuUsuario/NetSheriff.git](https://github.com/SeuUsuario/NetSheriff.git)