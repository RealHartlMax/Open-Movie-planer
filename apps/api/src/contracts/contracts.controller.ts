import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";

@Controller("projects/:projectId/contracts")
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param("projectId") projectId: string, @Body() dto: CreateContractDto) {
    return this.service.create(projectId, dto);
  }

  @Patch(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateContractDto
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    return this.service.remove(projectId, id);
  }
}
