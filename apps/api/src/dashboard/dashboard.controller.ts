import { Controller, Get, Param } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("projects/:projectId/dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboard(@Param("projectId") projectId: string) {
    return this.service.getDashboard(projectId);
  }
}
