import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import {
  BootstrapStrategy,
  DevelopmentBootstrapStrategy,
  LocalBootstrapStrategy,
  ProductionBootstrapStrategy,
  TestBootstrapStrategy,
} from './bootstrap-strategies';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: BootstrapStrategy,
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService): BootstrapStrategy => {
        switch (configService.nodeEnv) {
          case 'local':
            return new LocalBootstrapStrategy();
          case 'development':
            return new DevelopmentBootstrapStrategy();
          case 'test':
            return new TestBootstrapStrategy();
          case 'production':
          default:
            return new ProductionBootstrapStrategy();
        }
      },
    },
  ],
  exports: [BootstrapStrategy],
})
export class BootstrapModule {}
