/* eslint-disable indent */
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteCampusDTO {
  @ApiProperty({ example: 1, description: 'Identificador unico de un campus' })
  @IsInt({ message: 'El id debe ser numero entero' })
  @Min(1, { message: 'El id debe ser mayor o igual a 1' })
  id!: number;
}
