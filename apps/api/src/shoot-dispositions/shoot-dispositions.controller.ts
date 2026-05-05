import { Controller, Get, Param } from "@nestjs/common";
import { ShootDispositionsService } from "./shoot-dispositions.service";

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
}
