import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
