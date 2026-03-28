import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateIndicatorValueDto {
  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  target?: number | null;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
