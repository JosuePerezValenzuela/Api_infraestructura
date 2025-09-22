import 'dotenv/config';
import { DataSource } from 'typeorm';

const isNumber = (v?: string) => (v ? Number(v) : undefined);

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: isNumber(process.env.PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  schema: 'infraestructura',
  //Entidades vacio, ya que se migra con sql crudo
  entities: [],
  migrations: ['src/migrations/*.ts'],
  logging: true,
});

export default dataSource;
