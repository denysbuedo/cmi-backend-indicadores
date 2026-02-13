import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';
import { SourcesModule } from './modules/sources/sources.module';
import { TenantMiddleware } from './modules/common/middleware/tenant.middleware';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationModule } from './modules/automation/automation.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    IndicatorsModule,
    SourcesModule,
    DashboardModule,
    ExecutionModule,
    AutomationModule,
  ],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
