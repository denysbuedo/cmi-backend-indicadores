import {
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';

export class UpdateIndicatorValueDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsString()
  periodStart?: string;

  @IsOptional()
  @IsString()
  periodEnd?: string;
}
