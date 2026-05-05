import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class CreateContactDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsIn(["crew", "cast", "other"])
  category?: "crew" | "cast" | "other";

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
