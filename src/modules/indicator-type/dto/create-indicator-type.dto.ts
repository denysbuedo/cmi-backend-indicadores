import { IsString, IsOptional } from 'class-validator';

export class CreateIndicatorTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
