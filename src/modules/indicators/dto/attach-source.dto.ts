import { IsEnum, IsUUID } from 'class-validator';
import { SourceRole } from '@prisma/client';

export class AttachSourceDto {
  @IsUUID()
  sourceId: string;

  @IsEnum(SourceRole)
  role: SourceRole;
}
