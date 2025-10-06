import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBloquesBatch1760000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for bloques batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert bloques batch seeding.
  }
}
