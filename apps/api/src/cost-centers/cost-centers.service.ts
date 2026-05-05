import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  findAll(projectId: string) {
    return this.prisma.costCenter.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" }
    });
  }

  async create(projectId: string, dto: CreateCostCenterDto) {
    await this.assertProjectExists(projectId);
    const existing = await this.prisma.costCenter.findFirst({
      where: { projectId, name: dto.name }
    });
    if (existing) {
      throw new ConflictException(`Cost center "${dto.name}" already exists in this project`);
    }
    return this.prisma.costCenter.create({
      data: { projectId, name: dto.name, budget: dto.budget }
    });
  }

  async update(projectId: string, id: string, dto: UpdateCostCenterDto) {
    const cc = await this.prisma.costCenter.findFirst({ where: { id, projectId } });
    if (!cc) throw new NotFoundException(`Cost center ${id} not found`);
    if (dto.name && dto.name !== cc.name) {
      const conflict = await this.prisma.costCenter.findFirst({
        where: { projectId, name: dto.name }
      });
      if (conflict) {
        throw new ConflictException(`Cost center "${dto.name}" already exists in this project`);
      }
    }
    return this.prisma.costCenter.update({
      where: { id },
      data: { name: dto.name, budget: dto.budget !== undefined ? dto.budget : undefined }
    });
  }

  async remove(projectId: string, id: string) {
    const cc = await this.prisma.costCenter.findFirst({ where: { id, projectId } });
    if (!cc) throw new NotFoundException(`Cost center ${id} not found`);
    return this.prisma.costCenter.delete({ where: { id } });
  }
}
