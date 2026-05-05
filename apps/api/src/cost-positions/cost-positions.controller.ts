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
import { CostPositionsService } from './cost-positions.service';
import { CreateCostPositionDto } from './dto/create-cost-position.dto';
import { UpdateCostPositionDto } from './dto/update-cost-position.dto';

@Controller('cost-positions')
export class CostPositionsController {
  constructor(private readonly costPositionsService: CostPositionsService) {}

  @Post()
  create(@Body() createDto: CreateCostPositionDto) {
    return this.costPositionsService.create(createDto);
  }

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.costPositionsService.findByProject(projectId);
  }

  @Get('by-cost-center/:costCenterId')
  findByCostCenter(@Param('costCenterId') costCenterId: string) {
    return this.costPositionsService.findByCostCenter(costCenterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.costPositionsService.findOne(id);
  }

  @Get(':id/amount')
  calculateAmount(@Param('id') id: string) {
    const pos = this.costPositionsService.calculateAmount(id);
    return pos.then((p: any) => ({
      quantity: p.quantity,
      unitRate: p.unitRate,
      amount: p.quantity.toNumber() * p.unitRate.toNumber(),
    }));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCostPositionDto,
  ) {
    return this.costPositionsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.costPositionsService.remove(id);
  }
}
