import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { CastAssignmentsService } from "./cast-assignments.service";
import { CreateCastAssignmentDto } from "./dto/create-cast-assignment.dto";
import { UpdateCastAssignmentDto } from "./dto/update-cast-assignment.dto";

@Controller("projects/:projectId/shoot-days/:shootDayId/cast-assignments")
export class CastAssignmentsController {
  constructor(private readonly castAssignmentsService: CastAssignmentsService) {}

  @Post()
  create(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Body() dto: CreateCastAssignmentDto,
  ) {
    return this.castAssignmentsService.create(projectId, shootDayId, dto);
  }

  @Get()
  findAll(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
  ) {
    return this.castAssignmentsService.findAll(projectId, shootDayId);
  }

  @Patch(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCastAssignmentDto,
  ) {
    return this.castAssignmentsService.update(projectId, shootDayId, id, dto);
  }

  @Delete(":id")
  remove(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
  ) {
    return this.castAssignmentsService.remove(projectId, shootDayId, id);
  }
}
