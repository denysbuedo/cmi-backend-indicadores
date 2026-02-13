import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProcessDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
