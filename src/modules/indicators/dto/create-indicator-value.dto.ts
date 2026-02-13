import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateIndicatorValueDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
