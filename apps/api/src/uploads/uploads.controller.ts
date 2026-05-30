import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedActor } from '../auth/auth.types';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { Actor } from '../platform/actor.decorator';
import { platformPath } from '../platform/platform.constants';
import { PlatformMembershipGuard } from '../platform/platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import { ApiOrganizationHeader } from '../platform/platform-swagger.decorator';
import { FileUploadParamsDto } from './dto/confirm-upload.dto';
import { PresignUploadBodyDto } from './dto/presign-upload.dto';
import {
  FileUploadPresenter,
  PresignUploadPresenter,
  SignedReadUrlPresenter,
} from './presenters/file-upload.presenter';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformMembershipGuard)
@Controller(platformPath('uploads'))
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create signed upload URL',
    description: 'Create upload metadata and return a signed Supabase upload URL.',
  })
  @ApiBody({ type: PresignUploadBodyDto })
  @ApiOkResponse({ type: PresignUploadPresenter })
  async presign(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: PresignUploadBodyDto,
  ): Promise<PresignUploadPresenter> {
    return plainToInstance(
      PresignUploadPresenter,
      await this.uploadsService.presign(dto, actor),
      { excludeExtraneousValues: true },
    );
  }

  @Post(':fileId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm upload',
    description: 'Mark a pending upload as confirmed in the active organization.',
  })
  @ApiOkResponse({ type: FileUploadPresenter })
  async confirm(
    @Actor() actor: AuthenticatedActor,
    @Param() params: FileUploadParamsDto,
  ): Promise<FileUploadPresenter> {
    return plainToInstance(
      FileUploadPresenter,
      await this.uploadsService.confirm(params.fileId, actor),
      { excludeExtraneousValues: true },
    );
  }

  @Get(':fileId/url')
  @ApiOperation({
    summary: 'Get file URL',
    description: 'Return a response-time read URL for a confirmed upload.',
  })
  @ApiOkResponse({ type: SignedReadUrlPresenter })
  async getSignedUrl(
    @Actor() actor: AuthenticatedActor,
    @Param() params: FileUploadParamsDto,
  ): Promise<SignedReadUrlPresenter> {
    return plainToInstance(
      SignedReadUrlPresenter,
      { url: await this.uploadsService.getSignedUrl(params.fileId, actor) },
      { excludeExtraneousValues: true },
    );
  }
}
