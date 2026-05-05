import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async assertContactExists(projectId: string, id: string): Promise<void> {
    const contact = await this.prisma.projectContact.findFirst({ where: { id, projectId } });
    if (!contact) throw new NotFoundException(`Contact ${id} not found in project ${projectId}`);
  }

  async findAll(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.prisma.projectContact.findMany({
      where: { projectId },
      orderBy: [{ category: "asc" }, { fullName: "asc" }]
    });
  }

  async create(projectId: string, dto: CreateContactDto) {
    await this.assertProjectExists(projectId);
    return this.prisma.projectContact.create({
      data: {
        projectId,
        fullName: dto.fullName,
        category: dto.category ?? "other",
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes
      }
    });
  }

  async update(projectId: string, id: string, dto: UpdateContactDto) {
    await this.assertContactExists(projectId, id);
    return this.prisma.projectContact.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, id: string) {
    await this.assertContactExists(projectId, id);
    return this.prisma.projectContact.delete({ where: { id } });
  }
}
