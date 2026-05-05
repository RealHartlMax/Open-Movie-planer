import { Module } from "@nestjs/common";
import { CrewAssignmentsController } from "./crew-assignments.controller";
import { CrewAssignmentsService } from "./crew-assignments.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CrewAssignmentsController],
  providers: [CrewAssignmentsService],
})
export class CrewAssignmentsModule {}
