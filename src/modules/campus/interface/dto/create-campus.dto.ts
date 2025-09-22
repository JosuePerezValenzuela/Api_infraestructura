/* eslint-disable indent */
import { IsNumber, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateCampusDto {
  @IsString()
  @MaxLength(128)
  nombre!: string;

  @IsString()
  @MaxLength(256)
  direccion!: string;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;
}
