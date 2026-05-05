import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTimeEntryDto } from "./dto/create-time-entry.dto";
import { UpdateTimeEntryDto } from "./dto/update-time-entry.dto";

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async assertTimeEntryExists(projectId: string, id: string): Promise<void> {
    const prisma = this.prisma as any;
    const entry = await prisma.timeEntry.findFirst({ where: { id, projectId } });
    if (!entry) throw new NotFoundException(`Time entry ${id} not found in project ${projectId}`);
  }

  private async assertContactBelongsToProject(projectId: string, contactId: string): Promise<void> {
    const contact = await this.prisma.projectContact.findFirst({ where: { id: contactId, projectId } });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found in project ${projectId}`);
  }

  private parseTimeToMinutes(value: string): number {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) throw new BadRequestException(`Invalid time format: ${value}`);
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) throw new BadRequestException(`Invalid time format: ${value}`);
    return hours * 60 + minutes;
  }

  private resolveHours(dto: { hours?: number; startTime?: string; endTime?: string; breakMinutes?: number }, fallback?: number): number {
    if (typeof dto.hours === "number") {
      return Number(dto.hours.toFixed(2));
    }

    if (dto.startTime && dto.endTime) {
      const startMinutes = this.parseTimeToMinutes(dto.startTime);
      const endMinutes = this.parseTimeToMinutes(dto.endTime);
      const breakMinutes = dto.breakMinutes ?? 0;
      if (endMinutes <= startMinutes) {
        throw new BadRequestException("endTime must be after startTime");
      }
      const minutesWorked = endMinutes - startMinutes - breakMinutes;
      if (minutesWorked < 0) {
        throw new BadRequestException("breakMinutes cannot exceed worked time");
      }
      return Number((minutesWorked / 60).toFixed(2));
    }

    if (typeof fallback === "number") {
      return fallback;
    }

    throw new BadRequestException("Either hours or both startTime and endTime must be provided");
  }

  async findAll(projectId: string) {
    await this.assertProjectExists(projectId);
    const prisma = this.prisma as any;
    return prisma.timeEntry.findMany({
      where: { projectId },
      include: { contact: true },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }]
    });
  }

  async create(projectId: string, dto: CreateTimeEntryDto) {
    await this.assertProjectExists(projectId);
    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    const hours = this.resolveHours(dto);

    const prisma = this.prisma as any;
    return prisma.timeEntry.create({
      data: {
        projectId,
        contactId: dto.contactId,
        workDate: new Date(dto.workDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakMinutes: dto.breakMinutes ?? 0,
        hours,
        activity: dto.activity,
        approved: dto.approved ?? false,
        notes: dto.notes
      },
      include: { contact: true }
    });
  }

  async update(projectId: string, id: string, dto: UpdateTimeEntryDto) {
    await this.assertTimeEntryExists(projectId, id);
    const prisma = this.prisma as any;
    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Time entry ${id} not found`);

    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    const merged = {
      hours: dto.hours,
      startTime: dto.startTime ?? existing.startTime ?? undefined,
      endTime: dto.endTime ?? existing.endTime ?? undefined,
      breakMinutes: dto.breakMinutes ?? existing.breakMinutes
    };
    const hours = this.resolveHours(merged, Number(existing.hours));

    return prisma.timeEntry.update({
      where: { id },
      data: {
        contactId: dto.contactId,
        workDate: dto.workDate ? new Date(dto.workDate) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakMinutes: dto.breakMinutes,
        hours,
        activity: dto.activity,
        approved: dto.approved,
        notes: dto.notes
      },
      include: { contact: true }
    });
  }

  async remove(projectId: string, id: string) {
    await this.assertTimeEntryExists(projectId, id);
    const prisma = this.prisma as any;
    return prisma.timeEntry.delete({ where: { id } });
  }
}
