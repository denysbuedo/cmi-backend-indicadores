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
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import type { Request } from 'express';

@Controller('processes')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProcessDto) {
    return this.processService.create(req['tenantId'], dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.processService.findAll(req['tenantId']);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProcessDto,
  ) {
    return this.processService.update(id, req['tenantId'], dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.processService.remove(id, req['tenantId']);
  }
}
