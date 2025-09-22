/* eslint-disable indent */
import { IsNumber, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCampusDto {
  @ApiProperty({ example: 'Campus Central', maxLength: 128 })
  @IsString()
  @MaxLength(128)
  nombre!: string;

  @ApiProperty({
    example: 'Avenida sucre entre belzu y oquendo',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  direccion!: string;

  @ApiProperty({ example: -17.3935, description: 'Latitud (y)' })
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -66.157, description: 'Longitud (x)' })
  @Type(() => Number)
  @IsNumber()
  lng!: number;
}
