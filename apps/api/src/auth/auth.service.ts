import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';
import type { AccessTokenPayload, AuthUser } from './auth.types';
import { RegisterUserDto } from './dto/register-user.dto';
import { CreateTokenDto } from './dto/create-token.dto';

const PASSWORD_HASH_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

type AuthenticatedUser = {
  id: bigint;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

type AuthResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto): Promise<AuthResponse> {
    this.assertValidPassword(registerUserDto.password);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: registerUserDto.email,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await argon2.hash(
      registerUserDto.password,
      PASSWORD_HASH_OPTIONS,
    );

    const user = await this.prisma.user.create({
      data: {
        email: registerUserDto.email,
        passwordHash,
        name: registerUserDto.name,
        avatarUrl: registerUserDto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(credentials: CreateTokenDto): Promise<AuthResponse> {
    this.assertValidPassword(credentials.password);

    const user = await this.prisma.user.findFirst({
      where: {
        email: credentials.email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await argon2.verify(
      user.passwordHash,
      credentials.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async issueTokenForCredentials(
    credentials: CreateTokenDto,
  ): Promise<{ access_token: string }> {
    const authResponse = await this.login(credentials);
    return {
      access_token: authResponse.access_token,
    };
  }

  async getSession(user: AuthUser) {
    const sessionUser = await this.prisma.user.findFirst({
      where: {
        id: user.userId,
        email: user.email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        organizationUsers: {
          where: {
            deletedAt: null,
            status: 'active',
          },
          select: {
            id: true,
            governanceRole: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                deletedAt: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!sessionUser) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: sessionUser.id.toString(),
        email: sessionUser.email,
        name: sessionUser.name,
        avatarUrl: sessionUser.avatarUrl,
      },
      memberships: sessionUser.organizationUsers
        .filter((membership) => membership.organization.deletedAt == null)
        .map((membership) => ({
          id: membership.id.toString(),
          governanceRole: membership.governanceRole,
          organization: {
            id: membership.organization.id.toString(),
            name: membership.organization.name,
            slug: membership.organization.slug,
          },
        })),
    };
  }

  buildPayload(user: Pick<AuthUser, 'userId' | 'email'>): AccessTokenPayload {
    return {
      sub: user.userId.toString(),
      email: user.email,
    };
  }

  private buildAuthResponse(user: AuthenticatedUser): AuthResponse {
    return {
      access_token: this.jwtService.sign(
        this.buildPayload({
          userId: user.id,
          email: user.email,
        }),
      ),
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private assertValidPassword(password: unknown): asserts password is string {
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 256
    ) {
      throw new BadRequestException(
        'Password must be between 8 and 256 characters',
      );
    }
  }
}
