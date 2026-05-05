import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BudgetScenariosService } from './budget-scenarios.service';
import { CreateBudgetScenarioDto } from './dto/create-budget-scenario.dto';
import { UpdateBudgetScenarioDto } from './dto/update-budget-scenario.dto';

@Controller('budget-scenarios')
export class BudgetScenariosController {
  constructor(
    private readonly budgetScenariosService: BudgetScenariosService,
  ) {}

  @Post()
  create(@Body() createDto: CreateBudgetScenarioDto) {
    return this.budgetScenariosService.create(createDto);
  }

  @Get()
  findByCostCenter(@Query('costCenterId') costCenterId: string) {
    return this.budgetScenariosService.findByCostCenter(costCenterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetScenariosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBudgetScenarioDto,
  ) {
    return this.budgetScenariosService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetScenariosService.remove(id);
  }
}
