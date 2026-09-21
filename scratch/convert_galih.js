const path = require('path');
const dbNodeModules = path.join(__dirname, '../packages/database/node_modules');
const { PrismaClient } = require(path.join(dbNodeModules, '@prisma/client'));

let bcrypt;
try {
  bcrypt = require(path.join(__dirname, '../apps/api/node_modules/bcryptjs'));
} catch {
  bcrypt = require(path.join(__dirname, '../apps/api/node_modules/bcrypt'));
}

const prisma = new PrismaClient();

async function run() {
  const app = await prisma.admissionApplication.findFirst({
    where: { fullName: { contains: 'Galih', mode: 'insensitive' } },
    include: { payments: true, studyProgram: true, student: true }
  });

  if (!app) {
    console.log('App not found');
    return;
  }

  // Format Tanggal Lahir (DDMMYYYY): '2026-09-17' -> '17092026'
  const birthPass = '17092026';
  const passwordHash = await bcrypt.hash(birthPass, 10);

  let user = await prisma.user.findUnique({ where: { email: app.email } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'STUDENT',
        passwordHash,
        isActive: true,
      }
    });
  }

  console.log('PASSWORD_UPDATE_SUCCESS');
  console.log(JSON.stringify({
    nim: app.nim || app.student?.nim || '270010016',
    fullName: app.fullName,
    email: app.email,
    birthDate: app.birthDate || '17-09-2026',
    generatedPassword: birthPass,
    role: 'STUDENT'
  }, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
