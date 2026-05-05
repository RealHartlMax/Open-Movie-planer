export class CreateShootDayActivityDto {
  shootDayId!: string;
  title!: string;
  time?: string;
  crew?: string;
  notes?: string;
  transport?: string;
  equipment?: string;
  catering?: string;
}
