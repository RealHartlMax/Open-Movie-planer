export class CreateSceneDto {
  sceneNumber!: string;
  title!: string;
  synopsis?: string;
  location?: string;
  estimatedDuration?: number;
}
