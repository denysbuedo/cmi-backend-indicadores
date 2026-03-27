import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  tenantIds?: string[];
}
