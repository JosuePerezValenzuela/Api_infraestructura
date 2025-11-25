import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para recibir la lista de activos a asociar a un ambiente.
export class AssignActivosDto {
  @ApiProperty({
    description: 'Listado de ids de activos a asociar',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray({ message: 'activoIds debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'activoIds debe tener al menos un id' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Cada activoIds debe ser un entero' })
  @Min(1, { each: true, message: 'Cada activoIds debe ser >= 1' })
  activoIds!: number[];
}
