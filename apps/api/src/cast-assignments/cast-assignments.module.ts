import { Module } from "@nestjs/common";
import { CastAssignmentsController } from "./cast-assignments.controller";
import { CastAssignmentsService } from "./cast-assignments.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CastAssignmentsController],
  providers: [CastAssignmentsService],
})
export class CastAssignmentsModule {}
