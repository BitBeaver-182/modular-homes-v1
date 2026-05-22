import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import type { AccessTokenPayload, AuthUser } from './auth.types';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto): Promise<{
    access_token: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }> {
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

    const user = await this.prisma.user.create({
      data: {
        email: registerUserDto.email,
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
