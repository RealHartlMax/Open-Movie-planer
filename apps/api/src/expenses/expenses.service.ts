import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  findAll(projectId: string) {
    return this.prisma.expense.findMany({
      where: { projectId },
      include: { costCenter: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(projectId: string, dto: CreateExpenseDto) {
    await this.assertProjectExists(projectId);
    if (dto.costCenterId) {
      const cc = await this.prisma.costCenter.findFirst({
        where: { id: dto.costCenterId, projectId }
      });
      if (!cc) {
        throw new BadRequestException(
          `Cost center ${dto.costCenterId} not found in project ${projectId}`
        );
      }
    }
    return this.prisma.expense.create({
      data: {
        projectId,
        amount: dto.amount,
        description: dto.description,
        costCenterId: dto.costCenterId ?? null,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined
      }
    });
  }

  async update(projectId: string, id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({ where: { id, projectId } });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    if (dto.costCenterId) {
      const cc = await this.prisma.costCenter.findFirst({
        where: { id: dto.costCenterId, projectId }
      });
      if (!cc) {
        throw new BadRequestException(
          `Cost center ${dto.costCenterId} not found in project ${projectId}`
        );
      }
    }
    return this.prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount,
        description: dto.description,
        costCenterId: dto.costCenterId ?? undefined,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined
      }
    });
  }

  async remove(projectId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, projectId } });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return this.prisma.expense.delete({ where: { id } });
  }
}
