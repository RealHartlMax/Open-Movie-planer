import { Module } from '@nestjs/common';
import { BudgetScenariosService } from './budget-scenarios.service';
import { BudgetScenariosController } from './budget-scenarios.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetScenariosController],
  providers: [BudgetScenariosService],
  exports: [BudgetScenariosService],
})
export class BudgetScenariosModule {}
