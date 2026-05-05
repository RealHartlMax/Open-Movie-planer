import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async assertContractExists(projectId: string, id: string): Promise<void> {
    const prisma = this.prisma as any;
    const contract = await prisma.projectContract.findFirst({ where: { id, projectId } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found in project ${projectId}`);
  }

  private async assertContactBelongsToProject(projectId: string, contactId: string): Promise<void> {
    const contact = await this.prisma.projectContact.findFirst({ where: { id: contactId, projectId } });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found in project ${projectId}`);
  }

  async findAll(projectId: string) {
    await this.assertProjectExists(projectId);
    const prisma = this.prisma as any;
    return prisma.projectContract.findMany({
      where: { projectId },
      include: { contact: true },
      orderBy: [{ createdAt: "desc" }, { title: "asc" }]
    });
  }

  async create(projectId: string, dto: CreateContractDto) {
    await this.assertProjectExists(projectId);
    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    const prisma = this.prisma as any;
    return prisma.projectContract.create({
      data: {
        projectId,
        contactId: dto.contactId,
        title: dto.title,
        contractType: dto.contractType,
        status: dto.status,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        notes: dto.notes
      },
      include: { contact: true }
    });
  }

  async update(projectId: string, id: string, dto: UpdateContractDto) {
    await this.assertContractExists(projectId, id);
    if (dto.contactId) {
      await this.assertContactBelongsToProject(projectId, dto.contactId);
    }

    const prisma = this.prisma as any;
    return prisma.projectContract.update({
      where: { id },
      data: {
        contactId: dto.contactId,
        title: dto.title,
        contractType: dto.contractType,
        status: dto.status,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        notes: dto.notes
      },
      include: { contact: true }
    });
  }

  async remove(projectId: string, id: string) {
    await this.assertContractExists(projectId, id);
    const prisma = this.prisma as any;
    return prisma.projectContract.delete({ where: { id } });
  }
}
