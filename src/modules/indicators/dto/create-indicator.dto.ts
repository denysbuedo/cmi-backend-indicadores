import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
} from 'class-validator';
import { IndicatorUnit, EvaluationDirection } from '@prisma/client';

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

  @IsNumber()
  @Min(0)
  decimals: number;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsEnum(EvaluationDirection)
  evaluationDirection: EvaluationDirection;

  @IsOptional()
  @IsNumber()
  frequencyMonths?: number;

  @IsOptional()
  @IsNumber()
  frequencyDays?: number;

  @IsUUID()
  processId: string;

  @IsUUID()
  indicatorTypeId: string;

  @IsArray()
  @IsUUID("4", { each: true })
  objectiveIds: string[];
}