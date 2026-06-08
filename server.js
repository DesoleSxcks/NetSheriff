import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import api from './routes/api.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
