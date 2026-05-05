import { IsString, IsOptional, IsNumber, IsUUID, IsDateString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateExpenseDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}
