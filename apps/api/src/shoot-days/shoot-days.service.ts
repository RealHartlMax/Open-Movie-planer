import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShootDayDto } from "./dto/create-shoot-day.dto";
import { UpdateShootDayDto } from "./dto/update-shoot-day.dto";

@Injectable()
export class ShootDaysService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  findAll(projectId: string) {
    return this.prisma.shootDay.findMany({
      where: { projectId },
      orderBy: { date: "asc" }
    });
  }

  async create(projectId: string, dto: CreateShootDayDto) {
    await this.assertProjectExists(projectId);
    return this.prisma.shootDay.create({
      data: {
        projectId,
        date: new Date(dto.date),
        location: dto.location,
        locationOwner: dto.locationOwner,
        locationContactPerson: dto.locationContactPerson,
        notes: dto.notes,
        callTime: dto.callTime,
        weather: dto.weather
      }
    });
  }

  async update(projectId: string, id: string, dto: UpdateShootDayDto) {
    const sd = await this.prisma.shootDay.findFirst({ where: { id, projectId } });
    if (!sd) throw new NotFoundException(`Shoot day ${id} not found`);
    return this.prisma.shootDay.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        location: dto.location,
        locationOwner: dto.locationOwner,
        locationContactPerson: dto.locationContactPerson,
        notes: dto.notes,
        callTime: dto.callTime,
        weather: dto.weather
      }
    });
  }

  async remove(projectId: string, id: string) {
    const sd = await this.prisma.shootDay.findFirst({ where: { id, projectId } });
    if (!sd) throw new NotFoundException(`Shoot day ${id} not found`);
    return this.prisma.shootDay.delete({ where: { id } });
  }
}
