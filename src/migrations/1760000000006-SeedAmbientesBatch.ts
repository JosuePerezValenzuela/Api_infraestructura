import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAmbientesBatch1760000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for ambientes batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert ambientes batch seeding.
  }
}
