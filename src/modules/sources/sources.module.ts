import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
