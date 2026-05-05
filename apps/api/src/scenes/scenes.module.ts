import { Module } from "@nestjs/common";
import { ScenesController } from "./scenes.controller";
import { ScenesService } from "./scenes.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ScenesController],
  providers: [ScenesService],
})
export class ScenesModule {}
