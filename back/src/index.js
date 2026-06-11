import express from 'express';
import cors from 'cors';

// Importa os modulos de rotas
import rulesRoutes from '../routes/rules.js';
import alertsRoutes from '../routes/alerts.js';
import logsRoutes from '../routes/logs.js';
import trafficRoutes from '../routes/traffic.js';

const app = express();
const PORT = 3000; 

// Configura o middleware CORS para permitir requisicoes de outras origens
app.use(cors()); 
// Configura o middleware para processar corpos de requisicao em formato JSON
app.use(express.json()); 

// Registra as rotas na aplicacao
app.use(rulesRoutes);
app.use(alertsRoutes);
app.use(logsRoutes);
app.use(trafficRoutes);

// Define a rota raiz para verificacao de disponibilidade (health check)
app.get('/', (req, res) => {
  res.send('NetSheriff Express API is running.');
});

// Inicia o servidor e escuta na porta definida
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});