import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type DispositionActivity = {
  id: string;
  title: string;
  time: string | null;
  crew: string | null;
  notes: string | null;
  transport: string | null;
  equipment: string | null;
  catering: string | null;
};

type DispositionScene = {
  id: string;
  sceneNumber: string;
  title: string;
  synopsis: string | null;
  location: string | null;
  estimatedDuration: number | null;
};

type DispositionCrewMember = {
  id: string;
  name: string;
  role: string | null;
  callTime: string | null;
  wrapTime: string | null;
  notes: string | null;
};

type DispositionCastMember = {
  id: string;
  name: string;
  character: string | null;
  callTime: string | null;
  scenes: string | null;
  notes: string | null;
};

type ShootDisposition = {
  shootDayId: string;
  projectId: string;
  date: Date;
  location: string | null;
  locationOwner: string | null;
  locationContactPerson: string | null;
  notes: string | null;
  callTime: string | null;
  weather: string | null;
  activities: DispositionActivity[];
  scenes: DispositionScene[];
  crewAssignments: DispositionCrewMember[];
  castAssignments: DispositionCastMember[];
};

@Injectable()
export class ShootDispositionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private mapDisposition(shootDay: any): ShootDisposition {
    const activities = (shootDay.activities ?? []) as DispositionActivity[];
    const scenes = (shootDay.scenes ?? []) as DispositionScene[];
    const crewAssignments = (shootDay.crewAssignments ?? []) as DispositionCrewMember[];
    const castAssignments = (shootDay.castAssignments ?? []) as DispositionCastMember[];

    // Derive callTime: first from shootDay.callTime, then from earliest crew callTime, then first activity time
    const callTime =
      shootDay.callTime ??
      crewAssignments.find((c) => c.callTime)?.callTime ??
      activities.find((a) => a.time)?.time ??
      null;

    return {
      shootDayId: shootDay.id,
      projectId: shootDay.projectId,
      date: shootDay.date,
      location: shootDay.location,
      locationOwner: shootDay.locationOwner ?? null,
      locationContactPerson: shootDay.locationContactPerson ?? null,
      notes: shootDay.notes,
      callTime,
      weather: shootDay.weather ?? null,
      activities,
      scenes,
      crewAssignments,
      castAssignments
    };
  }

  async findAll(projectId: string): Promise<ShootDisposition[]> {
    await this.assertProjectExists(projectId);

    const prisma = this.prisma as any;
    const shootDays = await prisma.shootDay.findMany({
      where: { projectId },
      include: {
        activities: { orderBy: { time: "asc" } },
        scenes: { orderBy: { sceneNumber: "asc" } },
        crewAssignments: { orderBy: { callTime: "asc" } },
        castAssignments: { orderBy: { callTime: "asc" } }
      },
      orderBy: { date: "asc" }
    });

    return shootDays.map((item: any) => this.mapDisposition(item));
  }

  async findOne(projectId: string, shootDayId: string): Promise<ShootDisposition> {
    await this.assertProjectExists(projectId);

    const prisma = this.prisma as any;
    const shootDay = await prisma.shootDay.findFirst({
      where: { id: shootDayId, projectId },
      include: {
        activities: { orderBy: { time: "asc" } },
        scenes: { orderBy: { sceneNumber: "asc" } },
        crewAssignments: { orderBy: { callTime: "asc" } },
        castAssignments: { orderBy: { callTime: "asc" } }
      }
    });

    if (!shootDay) {
      throw new NotFoundException(`Shoot day ${shootDayId} not found`);
    }

    return this.mapDisposition(shootDay);
  }
}

