import { Module } from '@nestjs/common';
import { IndicatorTypeController } from './indicator-type.controller';
import { IndicatorTypeService } from './indicator-type.service';

@Module({
  controllers: [IndicatorTypeController],
  providers: [IndicatorTypeService],
})
export class IndicatorTypeModule {}
