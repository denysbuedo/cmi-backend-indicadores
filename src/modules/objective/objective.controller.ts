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
import { ObjectiveService } from './objective.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import type { Request } from 'express';

@Controller('objectives')
export class ObjectiveController {
  constructor(private readonly objectiveService: ObjectiveService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateObjectiveDto) {
    return this.objectiveService.create(req['tenantId'], dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.objectiveService.findAll(req['tenantId']);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateObjectiveDto,
  ) {
    return this.objectiveService.update(req['tenantId'], id, dto);
  }

  @Patch(':id/toggle')
  toggle(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.objectiveService.toggleActive(req['tenantId'], id);
  }

  @Delete(':id')
  remove(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.objectiveService.remove(req['tenantId'], id);
  }
}
