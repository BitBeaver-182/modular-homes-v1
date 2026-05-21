import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  BootstrapStrategy,
  DevelopmentBootstrapStrategy,
  ProductionBootstrapStrategy,
  TestBootstrapStrategy,
} from './bootstrap-strategies';

@Module({
  providers: [
    {
      provide: BootstrapStrategy,
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService): BootstrapStrategy => {
        switch (configService.nodeEnv) {
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
