import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { ScenesService } from "./scenes.service";
import { CreateSceneDto } from "./dto/create-scene.dto";
import { UpdateSceneDto } from "./dto/update-scene.dto";

@Controller("projects/:projectId/shoot-days/:shootDayId/scenes")
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Post()
  create(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Body() dto: CreateSceneDto,
  ) {
    return this.scenesService.create(projectId, shootDayId, dto);
  }

  @Get()
  findAll(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
  ) {
    return this.scenesService.findAll(projectId, shootDayId);
  }

  @Patch(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
    @Body() dto: UpdateSceneDto,
  ) {
    return this.scenesService.update(projectId, shootDayId, id, dto);
  }

  @Delete(":id")
  remove(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
  ) {
    return this.scenesService.remove(projectId, shootDayId, id);
  }
}
