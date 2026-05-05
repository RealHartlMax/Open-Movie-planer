import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateContractDto {
  @IsString()
  title!: string;

  @IsString()
  contractType!: string;

  @IsIn(["draft", "active", "expired", "terminated"])
  status!: "draft" | "active" | "expired" | "terminated";

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
