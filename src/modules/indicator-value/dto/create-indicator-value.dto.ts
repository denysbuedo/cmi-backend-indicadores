import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateIndicatorValueDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsString()
  periodStart: string;

  @IsString()
  periodEnd: string;
}
