import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { CsrfController } from './csrf.controller';
import { CsrfProtectionService } from './csrf-protection.service';

@Module({
  imports: [AppConfigModule],
  controllers: [CsrfController],
  providers: [CsrfProtectionService],
  exports: [CsrfProtectionService],
})
export class SecurityModule {}
