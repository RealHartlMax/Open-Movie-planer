import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  title!: string;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}
