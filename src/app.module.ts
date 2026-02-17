import { Module, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

import { IndicatorsModule } from './modules/indicators/indicators.module';
import { ProcessModule } from './modules/process/process.module';
import { ObjectiveModule } from './modules/objective/objective.module';
import { IndicatorTypeModule } from './modules/indicator-type/indicator-type.module';
import { IndicatorValueModule } from './modules/indicator-value/indicator-value.module';
import { SourcesModule } from './modules/sources/sources.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AutomationModule } from './modules/automation/automation.module';

import { TenantMiddleware } from './modules/common/middleware/tenant.middleware';

@Module({
  imports: [
    PrismaModule,
    IndicatorsModule,
    ProcessModule,
    ObjectiveModule,
    IndicatorTypeModule,
    IndicatorValueModule,
    SourcesModule,
    ExecutionModule,
    DashboardModule,
    AutomationModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
