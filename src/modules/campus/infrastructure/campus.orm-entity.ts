/* eslint-disable indent */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'infraestructura', name: 'campus' })
export class CampusOrmEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 16 })
  codigo!: string;

  @Column({ type: 'varchar', length: 128 })
  nombre!: string;

  @Column({ type: 'varchar', length: 256 })
  direccion!: string;

  @Column({ type: 'point' })
  coordenadas!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({
    type: 'timestamptz',
    name: 'creado_en',
    default: () => 'CURRENT_TIMESTAMP',
  })
  creadoEn!: Date;

  @Column({
    type: 'timestamptz',
    name: 'actualizado_en',
    default: () => 'CURRENT_TIMESTAMP',
  })
  actualizadoEn!: Date;
}
