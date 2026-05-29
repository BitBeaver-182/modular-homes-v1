import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import {
  AppConfigService,
  type AppCorsOptions,
} from '../../config/app-config.service';
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
        const corsOptions: AppCorsOptions = configService.corsOptions;

        switch (configService.nodeEnv) {
          case 'local':
            return new LocalBootstrapStrategy(port, corsOptions);
          case 'development':
            return new DevelopmentBootstrapStrategy(port, corsOptions);
          case 'test':
            return new TestBootstrapStrategy(port, corsOptions);
          case 'production':
          default:
            return new ProductionBootstrapStrategy(port, corsOptions);
        }
      },
    },
  ],
  exports: [BootstrapStrategy],
})
export class BootstrapModule {}
