import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CostAccountingRow {
  costCenterId: string;
  costCenterName: string;
  sollAmount: number;
  istAmount: number;
  forecastAmount: number;
  endkosten: number;
  variance: number;
}

@Injectable()
export class ExternalCostAccountingService {
  constructor(private prisma: PrismaService) {}

  private asNumber(value: unknown): number {
    if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: unknown }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber();
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async getProjectCostAccounting(projectId: string): Promise<CostAccountingRow[]> {
    const prisma = this.prisma as any;
    
    const costCenters = await prisma.costCenter.findMany({
      where: { projectId },
      include: {
        expenses: true,
      },
    });

    return costCenters.map((cc: any) => {
      const sollAmount = this.asNumber(cc.budget);
      const istAmount = cc.expenses.reduce((sum: number, e: any) => sum + this.asNumber(e.amount), 0);
      const forecastAmount = this.asNumber(cc.forecastCost);
      const endkosten = forecastAmount;
      const variance = sollAmount - istAmount;

      return {
        costCenterId: cc.id,
        costCenterName: cc.name,
        sollAmount,
        istAmount,
        forecastAmount,
        endkosten,
        variance,
      };
    });
  }

  async updateForecast(costCenterId: string, forecastCost: number) {
    const prisma = this.prisma as any;
    return prisma.costCenter.update({
      where: { id: costCenterId },
      data: { forecastCost },
    });
  }
}
