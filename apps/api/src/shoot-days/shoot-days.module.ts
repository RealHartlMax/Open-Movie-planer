import { Module } from "@nestjs/common";
import { ShootDaysService } from "./shoot-days.service";
import { ShootDaysController } from "./shoot-days.controller";

@Module({
  providers: [ShootDaysService],
  controllers: [ShootDaysController]
})
export class ShootDaysModule {}
