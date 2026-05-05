import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ExternalCostAccountingService } from './external-cost-accounting.service';

@Controller('external-cost-accounting')
export class ExternalCostAccountingController {
  constructor(
    private readonly externalCostAccountingService: ExternalCostAccountingService,
  ) {}

  @Get()
  async getProjectAccounting(@Query('projectId') projectId: string) {
    return this.externalCostAccountingService.getProjectCostAccounting(projectId);
  }

  @Patch(':costCenterId/forecast')
  async updateForecast(
    @Param('costCenterId') costCenterId: string,
    @Body() body: { forecastCost: number },
  ) {
    return this.externalCostAccountingService.updateForecast(
      costCenterId,
      body.forecastCost,
    );
  }
}
