const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tracks = await prisma.admissionTrack.findMany();
  console.log('TRACKS:', JSON.stringify(tracks, null, 2));
}

run().finally(() => prisma.$disconnect());
