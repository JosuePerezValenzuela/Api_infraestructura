import { IsNumber, IsPositive } from 'class-validator';

export class DeleteFacultadCampusDto {
  @IsNumber()
  @IsPositive()
  id!: number;

  @IsNumber()
  @IsPositive()
  campusId!: number;
}