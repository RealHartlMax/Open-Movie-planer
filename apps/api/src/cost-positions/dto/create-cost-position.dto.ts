export class CreateCostPositionDto {
  projectId!: string;
  costCenterId!: string;
  parentId?: string;
  name!: string;
  quantity?: number;
  unitRate?: number;
  notes?: string;
}
