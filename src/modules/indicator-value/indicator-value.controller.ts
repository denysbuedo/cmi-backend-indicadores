import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IndicatorValueService } from './indicator-value.service';
import { CreateIndicatorValueDto } from './dto/create-indicator-value.dto';
import { UpdateIndicatorValueDto } from './dto/update-indicator-value.dto';

@Controller('indicator-values')
export class IndicatorValueController {
  constructor(private readonly service: IndicatorValueService) {}

  @Post(':indicatorId')
  create(
    @Req() req: Request,
    @Param('indicatorId') indicatorId: string,
    @Body() dto: CreateIndicatorValueDto,
  ) {
    return this.service.create(
      req['tenantId'],
      indicatorId,
      dto,
    );
  }

  @Get(':indicatorId')
  findByIndicator(
    @Req() req: Request,
    @Param('indicatorId') indicatorId: string,
  ) {
    return this.service.findByIndicator(
      req['tenantId'],
      indicatorId,
    );
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateIndicatorValueDto,
  ) {
    return this.service.update(
      req['tenantId'],
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.service.remove(
      req['tenantId'],
      id,
    );
  }
}
