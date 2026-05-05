import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { TimeEntriesService } from "./time-entries.service";
import { CreateTimeEntryDto } from "./dto/create-time-entry.dto";
import { UpdateTimeEntryDto } from "./dto/update-time-entry.dto";

@Controller("projects/:projectId/time-entries")
export class TimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param("projectId") projectId: string, @Body() dto: CreateTimeEntryDto) {
    return this.service.create(projectId, dto);
  }

  @Patch(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateTimeEntryDto
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    return this.service.remove(projectId, id);
  }
}
