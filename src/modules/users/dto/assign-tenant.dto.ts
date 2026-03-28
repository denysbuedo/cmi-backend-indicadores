import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { TenantRole } from '@prisma/client';

export class AssignTenantDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(TenantRole)
  @IsNotEmpty()
  role: TenantRole;
}
