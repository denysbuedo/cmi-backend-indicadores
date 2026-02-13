import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { IndicatorUnit } from '@prisma/client';

export class CreateIndicatorDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(IndicatorUnit)
  unit: IndicatorUnit;

  @IsInt()
  @Min(0)
  decimals: number;

  // 🔹 NUEVO
  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyDays?: number;

  @IsUUID()
  indicatorTypeId: string;

  @IsUUID()
  processId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  objectiveIds: string[];
}
