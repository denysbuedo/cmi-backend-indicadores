import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ObjectiveService } from './objective.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';

@Controller('objectives')
export class ObjectiveController {
  constructor(private readonly service: ObjectiveService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateObjectiveDto) {
    return this.service.create(req['tenantId'], dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req['tenantId']);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: Partial<CreateObjectiveDto>,
  ) {
    return this.service.update(req['tenantId'], id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.service.remove(req['tenantId'], id);
  }
}
