import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateCostCenterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget!: number;
}
