import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";
import { CostCentersModule } from "./cost-centers/cost-centers.module";
import { CostPositionsModule } from "./cost-positions/cost-positions.module";
import { BudgetScenariosModule } from "./budget-scenarios/budget-scenarios.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { ShootDaysModule } from "./shoot-days/shoot-days.module";
import { ShootDayActivitiesModule } from "./shoot-day-activities/shoot-day-activities.module";
import { ShootDispositionsModule } from "./shoot-dispositions/shoot-dispositions.module";
import { ScenesModule } from "./scenes/scenes.module";
import { CrewAssignmentsModule } from "./crew-assignments/crew-assignments.module";
import { CastAssignmentsModule } from "./cast-assignments/cast-assignments.module";
import { ExternalCostAccountingModule } from "./external-cost-accounting/external-cost-accounting.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { ContactsModule } from "./contacts/contacts.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { ContractsModule } from "./contracts/contracts.module";
import { TimeEntriesModule } from "./time-entries/time-entries.module";

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    CostCentersModule,
    CostPositionsModule,
    BudgetScenariosModule,
    ExpensesModule,
    ShootDaysModule,
    ShootDayActivitiesModule,
    ShootDispositionsModule,
    ScenesModule,
    CrewAssignmentsModule,
    CastAssignmentsModule,
    ExternalCostAccountingModule,
    DashboardModule,
    ContactsModule,
    AppointmentsModule,
    ContractsModule,
    TimeEntriesModule,
    HealthModule
  ]
})
export class AppModule {}

