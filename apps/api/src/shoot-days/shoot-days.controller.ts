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
import { ShootDaysService } from "./shoot-days.service";
import { CreateShootDayDto } from "./dto/create-shoot-day.dto";
import { UpdateShootDayDto } from "./dto/update-shoot-day.dto";

@Controller("projects/:projectId/shoot-days")
export class ShootDaysController {
  constructor(private readonly service: ShootDaysService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param("projectId") projectId: string, @Body() dto: CreateShootDayDto) {
    return this.service.create(projectId, dto);
  }

  @Put(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateShootDayDto
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    return this.service.remove(projectId, id);
  }
}
