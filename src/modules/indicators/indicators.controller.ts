import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import type { Request } from 'express';

@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateIndicatorDto) {
    return this.indicatorsService.createIndicator(req['tenantId'], dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.indicatorsService.findAllIndicators(req['tenantId']);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.indicatorsService.findOne(req['tenantId'], id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateIndicatorDto,
  ) {
    return this.indicatorsService.updateIndicator(req['tenantId'], id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Req() req: Request, @Param('id') id: string) {
    return this.indicatorsService.toggleActive(req['tenantId'], id);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.indicatorsService.softDeleteIndicator(req['tenantId'], id);
  }

  @Post(':id/values')
  createValue(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.indicatorsService.createIndicatorValue(
      req['tenantId'],
      id,
      dto,
    );
  }

  @Get(':id/history')
  history(@Req() req: Request, @Param('id') id: string) {
    return this.indicatorsService.getIndicatorHistory(
      req['tenantId'],
      id,
    );
  }
}
