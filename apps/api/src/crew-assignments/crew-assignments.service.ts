import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCrewAssignmentDto } from "./dto/create-crew-assignment.dto";
import { UpdateCrewAssignmentDto } from "./dto/update-crew-assignment.dto";

@Injectable()
export class CrewAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertShootDayExists(projectId: string, shootDayId: string): Promise<void> {
    const shootDay = await this.prisma.shootDay.findFirst({ where: { id: shootDayId, projectId } });
    if (!shootDay) {
      throw new NotFoundException(`ShootDay ${shootDayId} not found in project ${projectId}`);
    }
  }

  async create(projectId: string, shootDayId: string, dto: CreateCrewAssignmentDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.crewAssignment.create({ data: { shootDayId, ...dto } });
  }

  async findAll(projectId: string, shootDayId: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.crewAssignment.findMany({ where: { shootDayId }, orderBy: { callTime: "asc" } });
  }

  async update(projectId: string, shootDayId: string, id: string, dto: UpdateCrewAssignmentDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.crewAssignment.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`CrewAssignment ${id} not found`);
    return this.prisma.crewAssignment.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, shootDayId: string, id: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.crewAssignment.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`CrewAssignment ${id} not found`);
    return this.prisma.crewAssignment.delete({ where: { id } });
  }
}
