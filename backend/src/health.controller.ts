import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/api/health')
  check() {
    return { ok: true, time: Date.now() };
  }
}
