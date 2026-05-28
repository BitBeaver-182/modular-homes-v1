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
        const port = configService.port;

        switch (configService.nodeEnv) {
          case 'local':
            return new LocalBootstrapStrategy(port);
          case 'development':
            return new DevelopmentBootstrapStrategy(port);
          case 'test':
            return new TestBootstrapStrategy(port);
          case 'production':
          default:
            return new ProductionBootstrapStrategy(port);
        }
      },
    },
  ],
  exports: [BootstrapStrategy],
})
export class BootstrapModule {}
