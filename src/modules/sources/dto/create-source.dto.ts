import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { HttpMethod } from '@prisma/client';

export class CreateSourceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  endpoint: string;

  @IsEnum(HttpMethod)
  method: HttpMethod;

  @IsOptional()
  headers?: Record<string, any>;

  @IsOptional()
  queryParams?: Record<string, any>;

  @IsOptional()
  bodyTemplate?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(100)
  timeout?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
