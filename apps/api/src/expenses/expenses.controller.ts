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
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Controller("projects/:projectId/expenses")
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  findAll(@Param("projectId") projectId: string) {
    return this.service.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param("projectId") projectId: string, @Body() dto: CreateExpenseDto) {
    return this.service.create(projectId, dto);
  }

  @Put(":id")
  update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    return this.service.remove(projectId, id);
  }
}
