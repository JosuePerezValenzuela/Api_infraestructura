import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFacultadesBatch1760000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for facultades batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert facultades batch seeding.
  }
}
