import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IndicatorTypeService } from './indicator-type.service';
import { CreateIndicatorTypeDto } from './dto/create-indicator-type.dto';
import { UpdateIndicatorTypeDto } from './dto/update-indicator-type.dto';

@Controller('indicator-types')
export class IndicatorTypeController {
  constructor(
    private readonly service: IndicatorTypeService,
  ) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() dto: CreateIndicatorTypeDto,
  ) {
    return this.service.create(req['tenantId'], dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req['tenantId']);
  }

  @Get(':id')
  findOne(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.service.findOne(req['tenantId'], id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateIndicatorTypeDto,
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
