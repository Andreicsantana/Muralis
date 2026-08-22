import dotenv from 'dotenv';
import { app } from './app.js';
import { sequelize } from './config/database.js';
import { ensureBucketExists } from './config/storage.js';

dotenv.config();

const port = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await ensureBucketExists();

    app.listen(port, () => {
      process.stdout.write(`Server running on port ${port}\n`);
    });
  } catch (error: any) {
    process.stderr.write(`Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
}

bootstrap();
