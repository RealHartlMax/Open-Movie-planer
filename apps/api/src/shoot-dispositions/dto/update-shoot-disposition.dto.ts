import { IsOptional, IsString, IsDateString } from "class-validator";

export class UpdateShootDispositionDto {
  @IsOptional()
  @IsString()
  callTime?: string | null;

  @IsOptional()
  @IsString()
  weather?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  locationOwner?: string | null;

  @IsOptional()
  @IsString()
  locationContactPerson?: string | null;
}
