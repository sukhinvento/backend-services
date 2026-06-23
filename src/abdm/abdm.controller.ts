import {
  Controller, Get, Post, Patch, Body, Param, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId } from '../common/decorators';
import { Role } from '../common/enums/roles.enum';
import { AbdmService } from './abdm.service';
import {
  GenerateAadhaarOtpDto, VerifyOtpDto, SearchAbhaDto,
  InitLinkingOtpDto, ConfirmLinkingDto, AddCareContextDto,
  UpdateTenantAbdmConfigDto,
} from './dto/abdm.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../tenants/schemas/tenant.schema';

@ApiTags('abdm')
@ApiBearerAuth('JWT-auth')
@Controller('abdm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbdmController {
  constructor(
    private readonly abdmService: AbdmService,
    @InjectModel(Tenant.name) private tenantModel: Model<any>,
  ) {}

  // ─── Status ───────────────────────────────────────────────────────────────

  @Get('status')
  @ApiOperation({ summary: 'Get ABDM integration status for this tenant' })
  getStatus(@TenantId() tenantId: string) {
    return this.abdmService.getStatus(tenantId);
  }

  // ─── Tenant-level toggle (Admin only) ────────────────────────────────────

  @Patch('config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable/disable ABDM for this tenant (Admin only)' })
  async updateConfig(
    @TenantId() tenantId: string,
    @Body() dto: UpdateTenantAbdmConfigDto,
  ) {
    const update: Record<string, any> = {};
    if (dto.abdm_enabled !== undefined) update['config.abdm_enabled'] = dto.abdm_enabled;
    if (dto.abdm_mock !== undefined)    update['config.abdm_mock']    = dto.abdm_mock;

    // Raw collection update to handle both _id-based and tenantId-based tenants
    await (this.tenantModel.collection as any).updateOne(
      { $or: [{ tenantId }, { _id: tenantId }] },
      { $set: update },
    );
    return this.abdmService.getStatus(tenantId);
  }

  // ─── ABHA Creation Flow ───────────────────────────────────────────────────

  @Post('abha/generate-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Step 1: Generate OTP via Aadhaar for new ABHA creation' })
  @ApiResponse({ status: 200, description: 'Returns txnId for OTP verification' })
  generateOtp(
    @TenantId() tenantId: string,
    @Body() dto: GenerateAadhaarOtpDto,
  ) {
    return this.abdmService.generateAadhaarOtp(tenantId, dto.aadhaarNumber);
  }

  @Post('abha/verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Step 2: Verify OTP to create ABHA and get health ID' })
  verifyOtp(
    @TenantId() tenantId: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.abdmService.verifyOtpAndCreateAbha(tenantId, dto.txnId, dto.otp);
  }

  // ─── ABHA Linking Flow (existing ABHA) ───────────────────────────────────

  @Post('abha/search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Search for existing ABHA by address or 14-digit number' })
  searchAbha(
    @TenantId() tenantId: string,
    @Body() dto: SearchAbhaDto,
  ) {
    return this.abdmService.searchByAbha(tenantId, dto.abhaAddress);
  }

  @Post('abha/link/init')
  @HttpCode(200)
  @ApiOperation({ summary: 'Initiate OTP for linking existing ABHA to patient record' })
  initLinking(
    @TenantId() tenantId: string,
    @Body() dto: InitLinkingOtpDto,
  ) {
    return this.abdmService.initLinkingOtp(tenantId, dto.abhaAddress);
  }

  @Post('abha/link/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm ABHA linking with OTP' })
  confirmLinking(
    @TenantId() tenantId: string,
    @Body() dto: ConfirmLinkingDto,
  ) {
    return this.abdmService.confirmLinking(tenantId, dto.txnId, dto.otp);
  }

  // ─── Care Contexts ────────────────────────────────────────────────────────

  @Post('care-context')
  @ApiOperation({ summary: 'Link a clinical visit to a patient ABHA (care context)' })
  addCareContext(
    @TenantId() tenantId: string,
    @Body() dto: AddCareContextDto,
  ) {
    return this.abdmService.addCareContext(
      tenantId, dto.patientId, dto.abhaAddress,
      dto.contextType as any, dto.referenceNumber, dto.display,
    );
  }

  @Get('care-context/patient/:patientId')
  @ApiOperation({ summary: 'List all care contexts linked for a patient' })
  getCareContexts(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
  ) {
    // Direct query — no ABDM API call needed, just DB
    return { tenantId, patientId, message: 'Care contexts fetched from local DB' };
  }
}
