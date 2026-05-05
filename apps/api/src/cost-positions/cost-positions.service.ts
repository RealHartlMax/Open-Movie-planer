import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCostPositionDto } from './dto/create-cost-position.dto';
import { UpdateCostPositionDto } from './dto/update-cost-position.dto';

@Injectable()
export class CostPositionsService {
  constructor(private prisma: PrismaService) {}

  create(createDto: CreateCostPositionDto) {
    const prisma = this.prisma as any;
    return prisma.costPosition.create({
      data: {
        ...createDto,
        quantity: createDto.quantity || 1,
        unitRate: createDto.unitRate || 0,
      },
      include: { children: true, parent: true },
    });
  }

  findByProject(projectId: string) {
    const prisma = this.prisma as any;
    return prisma.costPosition.findMany({
      where: { projectId },
      include: { children: true, costCenter: true },
      orderBy: [{ costCenterId: 'asc' }, { name: 'asc' }],
    });
  }

  findByCostCenter(costCenterId: string) {
    const prisma = this.prisma as any;
    return prisma.costPosition.findMany({
      where: { costCenterId, parentId: null },
      include: { children: { include: { children: true } } },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    const prisma = this.prisma as any;
    return prisma.costPosition.findUniqueOrThrow({
      where: { id },
      include: { children: true, parent: true, costCenter: true },
    });
  }

  update(id: string, updateDto: UpdateCostPositionDto) {
    const prisma = this.prisma as any;
    return prisma.costPosition.update({
      where: { id },
      data: updateDto,
      include: { children: true, parent: true },
    });
  }

  remove(id: string) {
    const prisma = this.prisma as any;
    return prisma.costPosition.delete({
      where: { id },
    });
  }

  calculateAmount(id: string) {
    const prisma = this.prisma as any;
    return prisma.costPosition.findUniqueOrThrow({
      where: { id },
      select: {
        quantity: true,
        unitRate: true,
      },
    });
  }
}
