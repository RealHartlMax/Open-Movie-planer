import { Module } from "@nestjs/common";
import { ShootDispositionsController } from "./shoot-dispositions.controller";
import { ShootDispositionsService } from "./shoot-dispositions.service";

@Module({
  controllers: [ShootDispositionsController],
  providers: [ShootDispositionsService]
})
export class ShootDispositionsModule {}
