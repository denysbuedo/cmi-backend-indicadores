import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { IndicatorsService } from './indicators.service';
import { CreateIndicatorTypeDto } from './dto/create-indicator-type.dto';
import { CreateProcessDto } from './dto/create-process.dto';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { AttachSourceDto } from './dto/attach-source.dto';
import { CreateIndicatorValueDto } from './dto/create-indicator-value.dto';

@Controller('indicator-types')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  createIndicatorType(@Req() req: Request, @Body() dto: CreateIndicatorTypeDto) {
    return this.indicatorsService.createIndicatorType(
      (req as any).tenantId,
      dto,
    );
  }

  @Get()
  findAllIndicatorTypes(@Req() req: Request) {
    return this.indicatorsService.findAllIndicatorTypes(
      (req as any).tenantId,
    );
  }

  @Post('processes')
  createProcess(@Req() req: Request, @Body() dto: CreateProcessDto) {
    return this.indicatorsService.createProcess(
      (req as any).tenantId,
      dto,
    );
  }

  @Get('processes')
  findAllProcesses(@Req() req: Request) {
    return this.indicatorsService.findAllProcesses(
      (req as any).tenantId,
    );
  }

  @Post('objectives')
  createObjective(@Req() req: Request, @Body() dto: CreateObjectiveDto) {
    return this.indicatorsService.createObjective(
      (req as any).tenantId,
      dto,
    );
  }

  @Get('objectives')
  findAllObjectives(@Req() req: Request) {
    return this.indicatorsService.findAllObjectives(
      (req as any).tenantId,
    );
  }

  @Post('indicators')
  createIndicator(@Req() req: Request, @Body() dto: CreateIndicatorDto) {
    return this.indicatorsService.createIndicator(
      (req as any).tenantId,
      dto,
    );
  }

  @Get('indicators')
  findAllIndicators(@Req() req: Request) {
    return this.indicatorsService.findAllIndicators(
      (req as any).tenantId,
    );
  }

  @Post('indicators/:id/sources')
  attachSource(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AttachSourceDto,
  ) {
    return this.indicatorsService.attachSource(
      (req as any).tenantId,
      id,
      dto.sourceId,
      dto.role,
    );
  }

  @Post('indicators/:id/values')
  createValue(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateIndicatorValueDto,
  ) {
    return this.indicatorsService.createIndicatorValue(
      (req as any).tenantId,
      id,
      dto,
    );
  }

  @Get('indicators/:id/values')
  getHistory(@Req() req: Request, @Param('id') id: string) {
    return this.indicatorsService.getIndicatorHistory(
      (req as any).tenantId,
      id,
    );
  }
}
