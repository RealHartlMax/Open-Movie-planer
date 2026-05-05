import { Module } from '@nestjs/common';
import { CostPositionsService } from './cost-positions.service';
import { CostPositionsController } from './cost-positions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CostPositionsController],
  providers: [CostPositionsService],
  exports: [CostPositionsService],
})
export class CostPositionsModule {}
