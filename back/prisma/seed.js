import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { hashPassword } from '../src/lib/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./data/database.sqlite'
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const dbFile = path.join(__dirname, '../../front/db.json');
  const raw = await fs.readFile(dbFile, 'utf-8');
  const { rules, alerts, logs, traffic } = JSON.parse(raw);

  await prisma.rule.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.log.deleteMany();
  await prisma.traffic.deleteMany();

  await prisma.rule.createMany({
    data: rules.map((rule) => ({
      id: Number(rule.id),
      name: rule.name,
      condition: rule.condition,
      action: rule.action,
      status: rule.status
    }))
  });

  await prisma.alert.createMany({
    data: alerts.map((alert) => ({
      id: Number(alert.id),
      timestamp: alert.timestamp,
      type: alert.type,
      description: alert.description,
      severity: alert.severity,
      status: alert.status
    }))
  });

  await prisma.log.createMany({
    data: logs.map((log) => ({
      id: Number(log.id),
      timestamp: log.timestamp,
      origin: log.origin,
      type: log.type,
      severity: log.severity,
      actionType: log.actionType
    }))
  });

  await prisma.traffic.create({
    data: {
      labels: JSON.stringify(traffic.labels),
      data: JSON.stringify(traffic.data)
    }
  });

  const adminEmail = 'admin@netsherrif.com';
  const adminName = 'Administrador';
  const adminPassword = 'senha123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const adminHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: adminHash
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
