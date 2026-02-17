import { Module } from '@nestjs/common';
import { IndicatorValueController } from './indicator-value.controller';
import { IndicatorValueService } from './indicator-value.service';

@Module({
  controllers: [IndicatorValueController],
  providers: [IndicatorValueService],
})
export class IndicatorValueModule {}
