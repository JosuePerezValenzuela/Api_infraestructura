import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCampusBatch1760000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for campus batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert campus batch seeding.
  }
}
