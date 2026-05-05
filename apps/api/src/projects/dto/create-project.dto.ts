import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from "class-validator";

export enum ProjectStatus {
  pre = "pre",
  production = "production",
  post = "post"
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
