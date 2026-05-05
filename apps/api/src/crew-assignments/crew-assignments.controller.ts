import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { CrewAssignmentsService } from "./crew-assignments.service";
import { CreateCrewAssignmentDto } from "./dto/create-crew-assignment.dto";
import { UpdateCrewAssignmentDto } from "./dto/update-crew-assignment.dto";

@Controller("projects/:projectId/shoot-days/:shootDayId/crew-assignments")
export class CrewAssignmentsController {
  constructor(private readonly crewAssignmentsService: CrewAssignmentsService) {}

  @Post()
  create(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Body() dto: CreateCrewAssignmentDto,
  ) {
    return this.crewAssignmentsService.create(projectId, shootDayId, dto);
  }

  @Get()
  findAll(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
  ) {
    return this.crewAssignmentsService.findAll(projectId, shootDayId);
  }

  @Patch(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCrewAssignmentDto,
  ) {
    return this.crewAssignmentsService.update(projectId, shootDayId, id, dto);
  }

  @Delete(":id")
  remove(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Param("id") id: string,
  ) {
    return this.crewAssignmentsService.remove(projectId, shootDayId, id);
  }
}
