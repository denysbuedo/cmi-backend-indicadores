import { IsString, IsOptional } from 'class-validator';

export class CreateObjectiveDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
