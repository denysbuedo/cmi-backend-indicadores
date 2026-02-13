import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateSourceDto) {
    return this.sourcesService.create((req as any).tenantId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.sourcesService.findAll((req as any).tenantId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.sourcesService.findOne((req as any).tenantId, id);
  }
}
