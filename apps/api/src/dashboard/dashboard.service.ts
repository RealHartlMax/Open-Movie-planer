import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";

interface ShootDaySummary {
  id: string;
  date: Date;
  location: string | null;
}

interface CostCenterSummary {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

export interface DashboardResponse {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  nextShootDays: ShootDaySummary[];
  topCostCenters: CostCenterSummary[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(projectId: string): Promise<DashboardResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Aggregate budget from cost centers
    const costCenters = await this.prisma.costCenter.findMany({
      where: { projectId }
    });

    // Aggregate spent amounts grouped by cost center
    const expensesByCC = await this.prisma.expense.groupBy({
      by: ["costCenterId"],
      where: { projectId },
      _sum: { amount: true }
    });

    const spentMap = new Map<string | null, Decimal>();
    for (const row of expensesByCC) {
      spentMap.set(row.costCenterId, row._sum.amount ?? new Decimal(0));
    }

    let totalBudget = 0;
    for (const cc of costCenters) {
      totalBudget += Number((cc as { budget: Decimal }).budget);
    }

    let totalSpent = 0;
    for (const row of expensesByCC) {
      totalSpent += Number((row as { _sum: { amount: Decimal | null } })._sum.amount ?? 0);
    }

    // Next 3 future shoot days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextShootDays = await this.prisma.shootDay.findMany({
      where: { projectId, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, date: true, location: true }
    });

    // Top 3 cost centers by spent DESC
    const costCenterSummaries: CostCenterSummary[] = costCenters.map(
      (cc: { id: string; name: string; budget: Decimal }) => ({
        id: cc.id,
        name: cc.name,
        budget: Number(cc.budget),
        spent: Number(spentMap.get(cc.id) ?? 0)
      })
    );
    costCenterSummaries.sort((a, b) => b.spent - a.spent);
    const topCostCenters = costCenterSummaries.slice(0, 3);

    return {
      projectId,
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      remainingBudget: Math.round((totalBudget - totalSpent) * 100) / 100,
      nextShootDays,
      topCostCenters
    };
  }
}
