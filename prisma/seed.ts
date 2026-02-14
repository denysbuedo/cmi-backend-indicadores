import { PrismaClient, IndicatorUnit, EvaluationDirection } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===============================
  // TENANT
  // ===============================
  const tenant = await prisma.tenant.create({
    data: {
      name: 'MES',
      code: 'MES',
    },
  });

  // ===============================
  // INDICATOR TYPES
  // ===============================
  const essential = await prisma.indicatorType.create({
    data: {
      code: 'ESS',
      name: 'Esencial',
      tenantId: tenant.id,
    },
  });

  const strategic = await prisma.indicatorType.create({
    data: {
      code: 'STR',
      name: 'Estratégico',
      tenantId: tenant.id,
    },
  });

  // ===============================
  // PROCESSES
  // ===============================
  const qa = await prisma.process.create({
    data: {
      code: 'QA',
      name: 'Quality Assurance',
      tenantId: tenant.id,
    },
  });

  const dev = await prisma.process.create({
    data: {
      code: 'DEV',
      name: 'Desarrollo',
      tenantId: tenant.id,
    },
  });

  const ops = await prisma.process.create({
    data: {
      code: 'OPS',
      name: 'Operaciones',
      tenantId: tenant.id,
    },
  });

  // ===============================
  // OBJECTIVES
  // ===============================
  const objective1 = await prisma.objective.create({
    data: {
      code: 'REDUCE_DEFECTS',
      name: 'Reducir defectos',
      tenantId: tenant.id,
    },
  });

  const objective2 = await prisma.objective.create({
    data: {
      code: 'IMPROVE_PRODUCTIVITY',
      name: 'Mejorar productividad',
      tenantId: tenant.id,
    },
  });

  const objective3 = await prisma.objective.create({
    data: {
      code: 'INCREASE_STABILITY',
      name: 'Aumentar estabilidad',
      tenantId: tenant.id,
    },
  });

  // ===============================
  // HELPER PARA CREAR INDICADORES
  // ===============================
  async function createIndicator(
    code: string,
    name: string,
    unit: IndicatorUnit,
    processId: string,
    typeId: string,
    weight: number,
    direction: EvaluationDirection,
    target: number,
  ) {
    const indicator = await prisma.indicator.create({
      data: {
        code,
        name,
        unit,
        decimals: unit === 'PERCENT' ? 1 : 0,
        frequencyMonths: 12,
        weight,
        evaluationDirection: direction,
        tenantId: tenant.id,
        processId,
        indicatorTypeId: typeId,
      },
    });

    await prisma.indicatorObjective.create({
      data: {
        indicatorId: indicator.id,
        objectiveId: objective1.id,
      },
    });

    // Crear histórico 2021–2026
    const baseYear = 2021;
    for (let i = 0; i < 6; i++) {
      const year = baseYear + i;
      const value =
        unit === 'PERCENT'
          ? Math.random() * 40 + 60
          : Math.floor(Math.random() * 200 + 50);

      await prisma.indicatorValue.create({
        data: {
          indicatorId: indicator.id,
          tenantId: tenant.id,
          value,
          target,
          periodStart: new Date(`${year}-01-01`),
          periodEnd: new Date(`${year}-12-31`),
        },
      });
    }
  }

  // ===============================
  // CREAR 12 INDICADORES
  // ===============================

  await createIndicator('BUG_RATE', 'Tasa de defectos', 'PERCENT', qa.id, essential.id, 3, 'LOWER_IS_BETTER', 5);
  await createIndicator('TEST_COVERAGE', 'Cobertura de pruebas', 'PERCENT', qa.id, essential.id, 4, 'HIGHER_IS_BETTER', 85);
  await createIndicator('DEFECT_DENSITY', 'Densidad de defectos', 'PERCENT', qa.id, strategic.id, 3, 'LOWER_IS_BETTER', 4);
  await createIndicator('ESCAPED_DEFECTS', 'Defectos en producción', 'NUMBER', qa.id, strategic.id, 5, 'LOWER_IS_BETTER', 10);

  await createIndicator('COMMITS', 'Cantidad de commits', 'NUMBER', dev.id, essential.id, 2, 'HIGHER_IS_BETTER', 150);
  await createIndicator('LEAD_TIME', 'Lead time promedio', 'NUMBER', dev.id, strategic.id, 4, 'LOWER_IS_BETTER', 7);
  await createIndicator('DEPLOY_FREQ', 'Frecuencia de despliegue', 'NUMBER', dev.id, strategic.id, 3, 'HIGHER_IS_BETTER', 20);
  await createIndicator('CODE_REVIEW_TIME', 'Tiempo revisión código', 'NUMBER', dev.id, essential.id, 2, 'LOWER_IS_BETTER', 2);

  await createIndicator('INCIDENTS', 'Incidentes críticos', 'NUMBER', ops.id, essential.id, 5, 'LOWER_IS_BETTER', 3);
  await createIndicator('MTTR', 'Tiempo medio de recuperación', 'NUMBER', ops.id, strategic.id, 4, 'LOWER_IS_BETTER', 4);
  await createIndicator('AVAILABILITY', 'Disponibilidad', 'PERCENT', ops.id, strategic.id, 5, 'HIGHER_IS_BETTER', 99);
  await createIndicator('ERROR_RATE', 'Tasa de error', 'PERCENT', ops.id, essential.id, 4, 'LOWER_IS_BETTER', 2);

  console.log('✅ Seed completado correctamente');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
