import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetScenarioDto } from './dto/create-budget-scenario.dto';
import { UpdateBudgetScenarioDto } from './dto/update-budget-scenario.dto';

@Injectable()
export class BudgetScenariosService {
  constructor(private prisma: PrismaService) {}

  create(createDto: CreateBudgetScenarioDto) {
    const prisma = this.prisma as any;
    return prisma.budgetScenario.create({
      data: createDto,
    });
  }

  findByCostCenter(costCenterId: string) {
    const prisma = this.prisma as any;
    return prisma.budgetScenario.findMany({
      where: { costCenterId },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    const prisma = this.prisma as any;
    return prisma.budgetScenario.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: string, updateDto: UpdateBudgetScenarioDto) {
    const prisma = this.prisma as any;
    return prisma.budgetScenario.update({
      where: { id },
      data: updateDto,
    });
  }

  remove(id: string) {
    const prisma = this.prisma as any;
    return prisma.budgetScenario.delete({
      where: { id },
    });
  }
}
