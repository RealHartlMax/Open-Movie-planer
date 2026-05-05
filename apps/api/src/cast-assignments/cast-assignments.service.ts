import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCastAssignmentDto } from "./dto/create-cast-assignment.dto";
import { UpdateCastAssignmentDto } from "./dto/update-cast-assignment.dto";

@Injectable()
export class CastAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertShootDayExists(projectId: string, shootDayId: string): Promise<void> {
    const shootDay = await this.prisma.shootDay.findFirst({ where: { id: shootDayId, projectId } });
    if (!shootDay) {
      throw new NotFoundException(`ShootDay ${shootDayId} not found in project ${projectId}`);
    }
  }

  async create(projectId: string, shootDayId: string, dto: CreateCastAssignmentDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.castAssignment.create({ data: { shootDayId, ...dto } });
  }

  async findAll(projectId: string, shootDayId: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.castAssignment.findMany({ where: { shootDayId }, orderBy: { callTime: "asc" } });
  }

  async update(projectId: string, shootDayId: string, id: string, dto: UpdateCastAssignmentDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.castAssignment.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`CastAssignment ${id} not found`);
    return this.prisma.castAssignment.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, shootDayId: string, id: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.castAssignment.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`CastAssignment ${id} not found`);
    return this.prisma.castAssignment.delete({ where: { id } });
  }
}
