import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [MembershipsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
