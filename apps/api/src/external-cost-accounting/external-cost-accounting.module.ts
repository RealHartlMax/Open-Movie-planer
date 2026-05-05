import { Module } from '@nestjs/common';
import { ExternalCostAccountingService } from './external-cost-accounting.service';
import { ExternalCostAccountingController } from './external-cost-accounting.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalCostAccountingController],
  providers: [ExternalCostAccountingService],
  exports: [ExternalCostAccountingService],
})
export class ExternalCostAccountingModule {}
