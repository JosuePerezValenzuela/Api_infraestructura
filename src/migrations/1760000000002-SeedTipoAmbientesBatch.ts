import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoAmbientesBatch1760000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for tipo_ambientes batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert tipo_ambientes batch seeding.
  }
}
