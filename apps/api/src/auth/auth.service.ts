import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import type { AccessTokenPayload, AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async issueTokenForEmail(email: string): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      access_token: this.jwtService.sign(
        this.buildPayload({
          userId: user.id,
          email: user.email,
        }),
      ),
    };
  }

  buildPayload(user: Pick<AuthUser, 'userId' | 'email'>): AccessTokenPayload {
    return {
      sub: user.userId.toString(),
      email: user.email,
    };
  }
}
