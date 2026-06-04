import { Logger } from '@nestjs/common';
import { createApp } from './app-factory';

async function main() {
  const app = await createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => new Logger('Bootstrap').log(`API running on port ${port}`));
}

main();
