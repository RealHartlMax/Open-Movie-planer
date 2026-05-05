import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShootDayActivityDto } from './dto/create-shoot-day-activity.dto';
import { UpdateShootDayActivityDto } from './dto/update-shoot-day-activity.dto';

@Injectable()
export class ShootDayActivitiesService {
  constructor(private prisma: PrismaService) {}

  private async assertShootDayExists(projectId: string, shootDayId: string): Promise<void> {
    const shootDay = await this.prisma.shootDay.findFirst({ where: { id: shootDayId, projectId } });
    if (!shootDay) {
      throw new NotFoundException(`ShootDay ${shootDayId} not found in project ${projectId}`);
    }
  }

  async create(projectId: string, shootDayId: string, createDto: CreateShootDayActivityDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.shootDayActivity.create({
      data: {
        shootDayId,
        title: createDto.title,
        time: createDto.time,
        crew: createDto.crew,
        notes: createDto.notes,
        transport: createDto.transport,
        equipment: createDto.equipment,
        catering: createDto.catering
      }
    });
  }

  async findByShootDay(projectId: string, shootDayId: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    return this.prisma.shootDayActivity.findMany({
      where: { shootDayId },
      orderBy: { time: 'asc' }
    });
  }

  async findOne(projectId: string, shootDayId: string, id: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.shootDayActivity.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`ShootDayActivity ${id} not found`);
    return record;
  }

  async update(projectId: string, shootDayId: string, id: string, updateDto: UpdateShootDayActivityDto) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.shootDayActivity.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`ShootDayActivity ${id} not found`);
    return this.prisma.shootDayActivity.update({ where: { id }, data: updateDto });
  }

  async remove(projectId: string, shootDayId: string, id: string) {
    await this.assertShootDayExists(projectId, shootDayId);
    const record = await this.prisma.shootDayActivity.findFirst({ where: { id, shootDayId } });
    if (!record) throw new NotFoundException(`ShootDayActivity ${id} not found`);
    return this.prisma.shootDayActivity.delete({ where: { id } });
  }
}
