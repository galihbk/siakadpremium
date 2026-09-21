const { PrismaClient } = require('@siakad/database');
const prisma = new PrismaClient();

async function run() {
  const app = await prisma.admissionApplication.findFirst({
    where: { fullName: { contains: 'Galih', mode: 'insensitive' } },
    include: { payments: true, student: true }
  });
  console.log(JSON.stringify(app, null, 2));
  await prisma.$disconnect();
}

run();
