import { IsString, IsOptional, IsDateString } from "class-validator";

export class CreateShootDayDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  locationOwner?: string;

  @IsOptional()
  @IsString()
  locationContactPerson?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  callTime?: string;

  @IsOptional()
  @IsString()
  weather?: string;
}
