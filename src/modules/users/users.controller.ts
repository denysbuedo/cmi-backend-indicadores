import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    const tenantId = req['tenantId'];
    const user = req['user'];
    return this.usersService.create(tenantId, user, createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Asignar tenant
  @Post(':id/tenants')
  assignTenant(@Param('id') userId: string, @Body() dto: AssignTenantDto) {
    return this.usersService.assignTenant(userId, dto.tenantId, dto.role);
  }

  @Delete(':id/tenants/:tenantId')
  removeTenant(@Param('id') userId: string, @Param('tenantId') tenantId: string) {
    return this.usersService.removeTenant(userId, tenantId);
  }

  // Asignar proceso
  @Post(':id/processes')
  assignProcess(@Param('id') userId: string, @Body('processId') processId: string) {
    return this.usersService.assignProcess(userId, processId);
  }

  @Delete(':id/processes/:processId')
  removeProcess(@Param('id') userId: string, @Param('processId') processId: string) {
    return this.usersService.removeProcess(userId, processId);
  }

  // Asignar objetivo
  @Post(':id/objectives')
  assignObjective(@Param('id') userId: string, @Body('objectiveId') objectiveId: string) {
    return this.usersService.assignObjective(userId, objectiveId);
  }

  @Delete(':id/objectives/:objectiveId')
  removeObjective(@Param('id') userId: string, @Param('objectiveId') objectiveId: string) {
    return this.usersService.removeObjective(userId, objectiveId);
  }

  // Asignar indicador
  @Post(':id/indicators')
  assignIndicator(@Param('id') userId: string, @Body('indicatorId') indicatorId: string) {
    return this.usersService.assignIndicator(userId, indicatorId);
  }

  @Delete(':id/indicators/:indicatorId')
  removeIndicator(@Param('id') userId: string, @Param('indicatorId') indicatorId: string) {
    return this.usersService.removeIndicator(userId, indicatorId);
  }
}
