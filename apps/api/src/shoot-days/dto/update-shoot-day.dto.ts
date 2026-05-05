import { PartialType } from "@nestjs/mapped-types";
import { CreateShootDayDto } from "./create-shoot-day.dto";

export class UpdateShootDayDto extends PartialType(CreateShootDayDto) {}
