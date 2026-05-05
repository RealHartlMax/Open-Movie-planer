import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async assertAppointmentExists(projectId: string, id: string): Promise<void> {
    const appointment = await this.prisma.projectAppointment.findFirst({ where: { id, projectId } });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found in project ${projectId}`);
  }

  private async assertContactBelongsToProject(projectId: string, contactId: string): Promise<void> {
    const contact = await this.prisma.projectContact.findFirst({ where: { id: contactId, projectId } });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found in project ${projectId}`);
  }

  async findAll(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.prisma.projectAppointment.findMany({
      where: { projectId },
      include: { contact: true },
      orderBy: [{ startAt: "asc" }, { title: "asc" }]
    });
  }

  async create(projectId: string, dto: CreateAppointmentDto) {
    await this.assertProjectExists(projectId);
    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    return this.prisma.projectAppointment.create({
      data: {
        projectId,
        title: dto.title,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        location: dto.location,
        notes: dto.notes,
        contactId: dto.contactId
      },
      include: { contact: true }
    });
  }

  async update(projectId: string, id: string, dto: UpdateAppointmentDto) {
    await this.assertAppointmentExists(projectId, id);
    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    return this.prisma.projectAppointment.update({
      where: { id },
      data: {
        title: dto.title,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        location: dto.location,
        notes: dto.notes,
        contactId: dto.contactId
      },
      include: { contact: true }
    });
  }

  async remove(projectId: string, id: string) {
    await this.assertAppointmentExists(projectId, id);
    return this.prisma.projectAppointment.delete({ where: { id } });
  }
}
