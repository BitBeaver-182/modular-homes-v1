import type {
  AuthResponse,
  AuthTokenResponse,
  CurrentActorResponse,
  OrganizationResponse,
  SessionMembershipResponse,
  SessionResponse,
  UserSummaryResponse,
} from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class AuthUserPresenter implements UserSummaryResponse {
  constructor(partial: UserSummaryResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'owner@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ type: String, example: 'Owner User', nullable: true })
  name!: string | null;

  @Expose()
  @ApiProperty({
    type: String,
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  avatarUrl!: string | null;
}

export class AuthTokenPresenter implements AuthTokenResponse {
  constructor(partial: AuthTokenResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  access_token!: string;
}

class SessionOrganizationPresenter implements OrganizationResponse {
  constructor(partial: OrganizationResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Northwind Homes' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'northwind-homes' })
  slug!: string;
}

class SessionMembershipPresenter implements SessionMembershipResponse {
  constructor(partial: SessionMembershipResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ enum: ['owner', 'member'] })
  governanceRole!: SessionMembershipResponse['governanceRole'];

  @Expose()
  @Type(() => SessionOrganizationPresenter)
  @ApiProperty({ type: SessionOrganizationPresenter })
  organization!: SessionOrganizationPresenter;
}

export class AuthResponsePresenter implements AuthResponse {
  constructor(partial: AuthResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  access_token!: string;

  @Expose()
  @Type(() => AuthUserPresenter)
  @ApiProperty({ type: AuthUserPresenter })
  user!: AuthUserPresenter;
}

export class CurrentActorPresenter implements CurrentActorResponse {
  constructor(partial: CurrentActorResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  userId!: string;

  @Expose()
  @ApiProperty({ example: 'owner@example.com' })
  email!: string;
}

export class SessionResponsePresenter implements SessionResponse {
  constructor(partial: SessionResponse) {
    Object.assign(this, partial);
  }

  @Expose()
  @Type(() => AuthUserPresenter)
  @ApiProperty({ type: AuthUserPresenter })
  user!: AuthUserPresenter;

  @Expose()
  @Type(() => SessionMembershipPresenter)
  @ApiProperty({ type: SessionMembershipPresenter, isArray: true })
  memberships!: SessionMembershipPresenter[];
}
