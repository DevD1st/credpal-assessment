import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env paths
dotenv.config({ path: path.resolve(__dirname, '../../../../env/root.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../env/wallets.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'credpal',
  username: process.env.POSTGRES_USER || 'credpal',
  password: process.env.POSTGRES_PASSWORD || 'credpal',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  synchronize: false,
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations', '*.ts')],
  migrationsRun: false,
});
