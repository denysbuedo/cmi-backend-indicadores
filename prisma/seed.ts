import { PrismaClient, IndicatorUnit, EvaluationDirection } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==============================
  // TENANT
  // ==============================
  const tenant = await prisma.tenant.upsert({
    where: { code: 'MES' },
    update: {},
    create: {
      name: 'MES',
      code: 'MES',
    },
  });

  console.log('✅ Tenant ready');

  // ==============================
  // INDICATOR TYPE
  // ==============================
  const indicatorType = await prisma.indicatorType.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'ES',
      },
    },
    update: {},
    create: {
      code: 'ES',
      name: 'Esencial',
      description: 'Indicadores esenciales',
      tenantId: tenant.id,
    },
  });

  console.log('✅ IndicatorType ready');

  // ==============================
  // PROCESS
  // ==============================
  const process = await prisma.process.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'QA_SUPPORT',
      },
    },
    update: {},
    create: {
      code: 'QA_SUPPORT',
      name: 'Aseguramiento de la Calidad',
      description: 'Proceso de aseguramiento de la calidad',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Process ready');

  // ==============================
  // OBJECTIVE
  // ==============================
  const objective = await prisma.objective.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'REDUCE_SUPPORT_ERRORS',
      },
    },
    update: {},
    create: {
      code: 'REDUCE_SUPPORT_ERRORS',
      name: 'Disminuir errores introducidos durante soporte técnico',
      description: 'Reducir errores generados en soporte técnico',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Objective ready');

  // ==============================
  // INDICATOR
  // ==============================
  const indicator = await prisma.indicator.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'QA_SUPPORT_COMMITS',
      },
    },
    update: {},
    create: {
      code: 'QA_SUPPORT_COMMITS',
      name: 'Cantidad de commits realizados',
      unit: IndicatorUnit.NUMBER,
      decimals: 0,
      frequencyDays: 7,
      evaluationDirection: EvaluationDirection.HIGHER_IS_BETTER,
      tenantId: tenant.id,
      indicatorTypeId: indicatorType.id,
      processId: process.id,
      objectives: {
        create: [
          {
            objectiveId: objective.id,
          },
        ],
      },
    },
  });

  console.log('✅ Indicator ready');

  // ==============================
  // INITIAL VALUE
  // ==============================
  await prisma.indicatorValue.create({
    data: {
      indicatorId: indicator.id,
      tenantId: tenant.id,
      value: 120,
      target: 150,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-07'),
    },
  });

  console.log('✅ Initial value inserted');

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
