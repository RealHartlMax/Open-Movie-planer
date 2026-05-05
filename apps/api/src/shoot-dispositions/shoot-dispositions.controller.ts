import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ShootDispositionsService } from "./shoot-dispositions.service";
import { UpdateShootDispositionDto } from "./dto/update-shoot-disposition.dto";

@Controller("projects/:projectId/shoot-dispositions")
export class ShootDispositionsController {
  constructor(private readonly service: ShootDispositionsService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Get(":shootDayId")
  findOne(@Param("projectId") projectId: string, @Param("shootDayId") shootDayId: string) {
    return this.service.findOne(projectId, shootDayId);
  }

  @Put(":shootDayId")
  update(
    @Param("projectId") projectId: string,
    @Param("shootDayId") shootDayId: string,
    @Body() dto: UpdateShootDispositionDto
  ) {
    return this.service.update(projectId, shootDayId, dto);
  }
}
