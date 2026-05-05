import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSceneDto } from "./dto/create-scene.dto";
import { UpdateSceneDto } from "./dto/update-scene.dto";

@Injectable()
export class ScenesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertShootDayExists(projectId: string, shootDayId: string): Promise<void> {
    const shootDay = await this.prisma.shootDay.findFirst({ where: { id: shootDayId, projectId } });
    if (!shootDay) {
      throw new NotFoundException(`ShootDay ${shootDayId} not found in project ${projectId}`);
    }
  }

  async create(projectId: string, shootDayId: string, dto: CreateSceneDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.scene.create({ data: { shootDayId, ...dto } });
  }

  async findAll(projectId: string, shootDayId: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.scene.findMany({ where: { shootDayId }, orderBy: { sceneNumber: "asc" } });
  }

  async update(projectId: string, shootDayId: string, id: string, dto: UpdateSceneDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    const scene = await this.prisma.scene.findFirst({ where: { id, shootDayId } });
    if (!scene) throw new NotFoundException(`Scene ${id} not found`);
    return this.prisma.scene.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, shootDayId: string, id: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    const scene = await this.prisma.scene.findFirst({ where: { id, shootDayId } });
    if (!scene) throw new NotFoundException(`Scene ${id} not found`);
    return this.prisma.scene.delete({ where: { id } });
  }
}
