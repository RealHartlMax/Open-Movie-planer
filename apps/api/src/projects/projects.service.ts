import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.project.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto) {
    const { startDate, endDate, ...rest } = dto;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException("endDate must not be before startDate");
    }
    return this.prisma.project.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    const { startDate, endDate, ...rest } = dto;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException("endDate must not be before startDate");
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
