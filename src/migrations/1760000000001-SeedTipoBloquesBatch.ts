import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoBloquesBatch1760000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for tipo_bloques batch seeding.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert tipo_bloques batch seeding.
  }
}
