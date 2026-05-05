import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateTimeEntryDto {
  @IsDateString()
  workDate!: string;

  @IsString()
  activity!: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(720)
  breakMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  hours?: number;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
