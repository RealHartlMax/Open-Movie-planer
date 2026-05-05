import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShootDayActivitiesService } from './shoot-day-activities.service';
import { CreateShootDayActivityDto } from './dto/create-shoot-day-activity.dto';
import { UpdateShootDayActivityDto } from './dto/update-shoot-day-activity.dto';

@Controller('projects/:projectId/shoot-days/:shootDayId/activities')
export class ShootDayActivitiesController {
  constructor(
    private readonly shootDayActivitiesService: ShootDayActivitiesService,
  ) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('shootDayId') shootDayId: string,
    @Body() createDto: CreateShootDayActivityDto,
  ) {
    return this.shootDayActivitiesService.create(projectId, shootDayId, createDto);
  }

  @Get()
  findByShootDay(
    @Param('projectId') projectId: string,
    @Param('shootDayId') shootDayId: string,
  ) {
    return this.shootDayActivitiesService.findByShootDay(projectId, shootDayId);
  }

  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('shootDayId') shootDayId: string,
    @Param('id') id: string,
  ) {
    return this.shootDayActivitiesService.findOne(projectId, shootDayId, id);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('shootDayId') shootDayId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateShootDayActivityDto,
  ) {
    return this.shootDayActivitiesService.update(projectId, shootDayId, id, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('shootDayId') shootDayId: string,
    @Param('id') id: string,
  ) {
    return this.shootDayActivitiesService.remove(projectId, shootDayId, id);
  }
}
