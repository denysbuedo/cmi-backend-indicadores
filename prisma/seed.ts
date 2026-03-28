import { PrismaClient, IndicatorUnit, EvaluationDirection, UserRole, TenantRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===============================
  // TENANT
  // ===============================
  let tenant = await prisma.tenant.findFirst({
    where: { code: 'MES' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'MES',
        code: 'MES',
        subdomain: 'mes',
      },
    });
    console.log('✅ Tenant MES created');
  } else {
    console.log('✅ Tenant MES already exists');
    console.log('   Subdomain:', tenant.subdomain || 'NOT SET');
  }

  // ===============================
  // SUPER ADMIN USER
  // ===============================
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@cmi.com' },
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@cmi.com',
        passwordHash,
        fullName: 'Administrador del Sistema',
        role: UserRole.SUPER_ADMIN,
      },
    });

    // Asignar el tenant MES al admin
    await prisma.userTenant.create({
      data: {
        userId: adminUser.id,
        tenantId: tenant.id,
        role: TenantRole.ADMIN,
      },
    });

    console.log('✅ Super Admin user created (email: admin@cmi.com, password: admin123)');
  } else {
    console.log('✅ Super Admin user already exists');
  }

  // ===============================
  // INDICATOR TYPES
  // ===============================
  let essential = await prisma.indicatorType.findFirst({
    where: { code: 'ESS', tenantId: tenant.id },
  });

  if (!essential) {
    essential = await prisma.indicatorType.create({
      data: {
        code: 'ESS',
        name: 'Esencial',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Indicator Type ESS created');
  } else {
    console.log('✅ Indicator Type ESS already exists');
  }

  let strategic = await prisma.indicatorType.findFirst({
    where: { code: 'STR', tenantId: tenant.id },
  });

  if (!strategic) {
    strategic = await prisma.indicatorType.create({
      data: {
        code: 'STR',
        name: 'Estratégico',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Indicator Type STR created');
  } else {
    console.log('✅ Indicator Type STR already exists');
  }

  // ===============================
  // PROCESSES
  // ===============================
  let qa = await prisma.process.findFirst({
    where: { code: 'QA', tenantId: tenant.id },
  });

  if (!qa) {
    qa = await prisma.process.create({
      data: {
        code: 'QA',
        name: 'Quality Assurance',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Process QA created');
  } else {
    console.log('✅ Process QA already exists');
  }

  let dev = await prisma.process.findFirst({
    where: { code: 'DEV', tenantId: tenant.id },
  });

  if (!dev) {
    dev = await prisma.process.create({
      data: {
        code: 'DEV',
        name: 'Development',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Process DEV created');
  } else {
    console.log('✅ Process DEV already exists');
  }

  let ops = await prisma.process.findFirst({
    where: { code: 'OPS', tenantId: tenant.id },
  });

  if (!ops) {
    ops = await prisma.process.create({
      data: {
        code: 'OPS',
        name: 'Operations',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Process OPS created');
  } else {
    console.log('✅ Process OPS already exists');
  }

  // ===============================
  // OBJECTIVES
  // ===============================
  let obj1 = await prisma.objective.findFirst({
    where: { code: 'REDUCE_DEFECTS', tenantId: tenant.id },
  });

  if (!obj1) {
    obj1 = await prisma.objective.create({
      data: {
        code: 'REDUCE_DEFECTS',
        name: 'Reducir defectos',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Objective REDUCE_DEFECTS created');
  } else {
    console.log('✅ Objective REDUCE_DEFECTS already exists');
  }

  let obj2 = await prisma.objective.findFirst({
    where: { code: 'IMPROVE_PRODUCTIVITY', tenantId: tenant.id },
  });

  if (!obj2) {
    obj2 = await prisma.objective.create({
      data: {
        code: 'IMPROVE_PRODUCTIVITY',
        name: 'Mejorar productividad',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Objective IMPROVE_PRODUCTIVITY created');
  } else {
    console.log('✅ Objective IMPROVE_PRODUCTIVITY already exists');
  }

  let obj3 = await prisma.objective.findFirst({
    where: { code: 'INCREASE_STABILITY', tenantId: tenant.id },
  });

  if (!obj3) {
    obj3 = await prisma.objective.create({
      data: {
        code: 'INCREASE_STABILITY',
        name: 'Aumentar estabilidad',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Objective INCREASE_STABILITY created');
  } else {
    console.log('✅ Objective INCREASE_STABILITY already exists');
  }

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
    objectiveIds: string[],
  ) {
    // Verificar si el indicador ya existe
    let indicator = await prisma.indicator.findFirst({
      where: { code, tenantId: tenant!.id },
    });

    if (indicator) {
      console.log(`✅ Indicator ${code} already exists`);
      return;
    }

    indicator = await prisma.indicator.create({
      data: {
        code,
        name,
        unit,
        decimals: unit === 'PERCENT' ? 1 : 0,
        frequencyMonths: 12,
        weight,
        evaluationDirection: direction,
        tenantId: tenant!.id,
        processId,
        indicatorTypeId: typeId,
      },
    });

    console.log(`✅ Indicator ${code} created`);

    // Asignar objetivos
    for (const objectiveId of objectiveIds) {
      const existing = await prisma.indicatorObjective.findFirst({
        where: { indicatorId: indicator.id, objectiveId },
      });

      if (!existing) {
        await prisma.indicatorObjective.create({
          data: {
            indicatorId: indicator.id,
            objectiveId,
          },
        });
      }
    }

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
          tenantId: tenant!.id,
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

  await createIndicator('BUG_RATE', 'Tasa de defectos', 'PERCENT', qa.id, essential.id, 3, 'LOWER_IS_BETTER', 5, [obj1.id]);
  await createIndicator('TEST_COVERAGE', 'Cobertura de pruebas', 'PERCENT', qa.id, essential.id, 4, 'HIGHER_IS_BETTER', 85, [obj1.id]);
  await createIndicator('DEFECT_DENSITY', 'Densidad de defectos', 'PERCENT', qa.id, strategic.id, 3, 'LOWER_IS_BETTER', 4, [obj1.id]);
  await createIndicator('ESCAPED_DEFECTS', 'Defectos en producción', 'NUMBER', qa.id, strategic.id, 5, 'LOWER_IS_BETTER', 10, [obj1.id]);

  await createIndicator('COMMITS', 'Cantidad de commits', 'NUMBER', dev.id, essential.id, 2, 'HIGHER_IS_BETTER', 150, [obj2.id]);
  await createIndicator('LEAD_TIME', 'Lead time promedio', 'NUMBER', dev.id, strategic.id, 4, 'LOWER_IS_BETTER', 7, [obj2.id]);
  await createIndicator('DEPLOY_FREQ', 'Frecuencia de despliegue', 'NUMBER', dev.id, strategic.id, 3, 'HIGHER_IS_BETTER', 20, [obj2.id]);
  await createIndicator('CODE_REVIEW_TIME', 'Tiempo revisión código', 'NUMBER', dev.id, essential.id, 2, 'LOWER_IS_BETTER', 2, [obj2.id]);

  await createIndicator('INCIDENTS', 'Incidentes críticos', 'NUMBER', ops.id, essential.id, 5, 'LOWER_IS_BETTER', 3, [obj3.id]);
  await createIndicator('MTTR', 'Tiempo medio de recuperación', 'NUMBER', ops.id, strategic.id, 4, 'LOWER_IS_BETTER', 4, [obj3.id]);
  await createIndicator('AVAILABILITY', 'Disponibilidad', 'PERCENT', ops.id, strategic.id, 5, 'HIGHER_IS_BETTER', 99, [obj3.id]);
  await createIndicator('ERROR_RATE', 'Tasa de error', 'PERCENT', ops.id, essential.id, 4, 'LOWER_IS_BETTER', 2, [obj3.id]);

  console.log('✅ Seed completado correctamente');
  console.log('');
  console.log('🔐 ==========================================');
  console.log('🔐 CREDENCIALES DE ACCESO');
  console.log('🔐 ==========================================');
  console.log('🔐 Email: admin@cmi.com');
  console.log('🔐 Password: admin123');
  console.log('🔐 ==========================================');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
