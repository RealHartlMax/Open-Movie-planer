import { Module } from '@nestjs/common';
import { ShootDayActivitiesService } from './shoot-day-activities.service';
import { ShootDayActivitiesController } from './shoot-day-activities.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShootDayActivitiesController],
  providers: [ShootDayActivitiesService],
  exports: [ShootDayActivitiesService],
})
export class ShootDayActivitiesModule {}
