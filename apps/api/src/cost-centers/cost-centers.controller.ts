import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus
} from "@nestjs/common";
import { CostCentersService } from "./cost-centers.service";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";

@Controller("projects/:projectId/cost-centers")
export class CostCentersController {
  constructor(private readonly service: CostCentersService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param("projectId") projectId: string, @Body() dto: CreateCostCenterDto) {
    return this.service.create(projectId, dto);
  }

  @Put(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCostCenterDto
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    return this.service.remove(projectId, id);
  }
}
