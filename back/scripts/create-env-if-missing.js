import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const examplePath = path.join(rootDir, '.env.example');

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error(`Arquivo .env.example não encontrado em ${examplePath}`);
    process.exit(1);
  }

  mkdirSync(path.dirname(envPath), { recursive: true });
  copyFileSync(examplePath, envPath);
  console.log(`Arquivo .env criado a partir de ${path.relative(rootDir, examplePath)}.`);
} else {
  console.log('Arquivo .env já existe; nada a fazer.');
}
