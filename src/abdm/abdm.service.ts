import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbdmConfigService } from './abdm-config.service';
import { AbdmMockService } from './abdm-mock.service';
import { AbdmLiveService } from './abdm-live.service';
import { AbdmCareContext, AbdmCareContextDocument } from './schemas/abdm-care-context.schema';
import { FhirService } from './fhir/fhir.service';

export interface AbdmDisabledResponse {
  enabled: false;
  message: string;
}

export type AbdmResult<T> = T | AbdmDisabledResponse;

function isDisabled(r: any): r is AbdmDisabledResponse {
  return r?.enabled === false;
}

/**
 * AbdmService
 *
 * Single entry point for all ABDM operations.
 * Automatically routes to mock or live implementation
 * based on AbdmConfigService.
 *
 * All methods return `{ enabled: false }` when ABDM is disabled
 * so callers never need to check the flag themselves — they can
 * simply treat the response as optional metadata.
 */
@Injectable()
export class AbdmService {
  private readonly logger = new Logger(AbdmService.name);

  constructor(
    private readonly abdmConfig: AbdmConfigService,
    private readonly mock: AbdmMockService,
    private readonly live: AbdmLiveService,
    private readonly fhir: FhirService,
    @InjectModel(AbdmCareContext.name)
    private careContextModel: Model<AbdmCareContextDocument>,
  ) {}

  // ─── Feature-flag guard ───────────────────────────────────────────────────

  private async guard(tenantId: string): Promise<AbdmDisabledResponse | null> {
    const cfg = await this.abdmConfig.getConfig(tenantId);
    if (!cfg.enabled) {
      return { enabled: false, message: 'ABDM integration is not enabled for this tenant.' };
    }
    return null; // enabled — proceed
  }

  // ─── ABHA Creation Flow ───────────────────────────────────────────────────

  /**
   * Step 1: Generate OTP via Aadhaar.
   * Returns txnId to be passed to verifyOtpAndCreateAbha().
   */
  async generateAadhaarOtp(
    tenantId: string,
    aadhaarNumber: string,
  ): Promise<AbdmResult<{ txnId: string }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    this.logger.log(`generateAadhaarOtp tenant=${tenantId} mock=${cfg.mockMode}`);

    return cfg.mockMode
      ? this.mock.generateAadhaarOtp(aadhaarNumber)
      : this.live.generateAadhaarOtp(cfg, aadhaarNumber);
  }

  /**
   * Step 2: Verify OTP → creates ABHA and returns profile.
   */
  async verifyOtpAndCreateAbha(
    tenantId: string,
    txnId: string,
    otp: string,
  ): Promise<AbdmResult<{
    abhaNumber: string;
    abhaAddress: string;
    name: string;
    mobile: string;
    gender: string;
    yearOfBirth: string;
    state: string;
  }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    return cfg.mockMode
      ? this.mock.verifyOtpAndCreateAbha(txnId, otp)
      : this.live.verifyOtpAndCreateAbha(cfg, txnId, otp);
  }

  // ─── ABHA Linking Flow (existing ABHA) ───────────────────────────────────

  async searchByAbha(
    tenantId: string,
    abhaAddress: string,
  ): Promise<AbdmResult<{ healthId: string; healthIdNumber: string; name: string }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    return cfg.mockMode
      ? this.mock.searchByAbha(abhaAddress)
      : this.live.searchByAbha(cfg, abhaAddress);
  }

  async initLinkingOtp(
    tenantId: string,
    abhaAddress: string,
  ): Promise<AbdmResult<{ txnId: string }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    return cfg.mockMode
      ? this.mock.initLinkingOtp(abhaAddress)
      : this.live.initLinkingOtp(cfg, abhaAddress);
  }

  async confirmLinking(
    tenantId: string,
    txnId: string,
    otp: string,
  ): Promise<AbdmResult<{ status: string }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    return cfg.mockMode
      ? this.mock.confirmLinking(txnId, otp)
      : this.live.confirmLinking(cfg, txnId, otp);
  }

  // ─── Care Context (visit linking) ────────────────────────────────────────

  /**
   * Called after every admission, diagnostic completion, or OPD visit.
   * Links the clinical event to the patient's ABHA so records are discoverable.
   */
  async addCareContext(
    tenantId: string,
    patientId: string,
    abhaAddress: string,
    contextType: 'admission' | 'diagnostic' | 'opd',
    referenceNumber: string,   // e.g. ADM-2026-001
    display: string,            // e.g. "IPD Admission - 3 Jun 2026"
  ): Promise<AbdmResult<{ status: string }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    const cfg = await this.abdmConfig.getConfig(tenantId);
    const result = cfg.mockMode
      ? this.mock.addCareContext(abhaAddress, referenceNumber)
      : await this.live.addCareContext(cfg, abhaAddress, referenceNumber, display);

    // Persist care context record regardless of mock/live
    await this.careContextModel.create({
      tenantId,
      patientId,
      abhaAddress,
      contextType,
      referenceNumber,
      display,
      status: result.status,
      createdBy: 'system',
      updatedBy: 'system',
    });

    return result;
  }

  // ─── FHIR record generation ───────────────────────────────────────────────

  async generateDischargeSummary(
    tenantId: string,
    admissionData: { patient: any; admission: any; doctor?: any; medications?: any[]; diagnostics?: any[] },
  ): Promise<AbdmResult<{ bundleId: string; bundle: Record<string, any> }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    return this.fhir.buildDischargeSummary(admissionData);
  }

  async generateDiagnosticReport(
    tenantId: string,
    diagnosticData: { patient: any; booking: any; test: any; doctor?: any },
  ): Promise<AbdmResult<{ bundleId: string; bundle: Record<string, any> }>> {
    const disabled = await this.guard(tenantId);
    if (disabled) return disabled;

    return this.fhir.buildDiagnosticReport(diagnosticData);
  }

  // ─── Settings management ─────────────────────────────────────────────────

  async getStatus(tenantId: string): Promise<{
    globalEnabled: boolean;
    tenantEnabled: boolean | 'inherit';
    effectiveEnabled: boolean;
    mockMode: boolean;
    configured: boolean;
    note: string;
  }> {
    const cfg = await this.abdmConfig.getConfig(tenantId);
    return {
      globalEnabled: process.env.ABDM_ENABLED === 'true',
      tenantEnabled: cfg.enabled !== (process.env.ABDM_ENABLED === 'true') ? cfg.enabled : 'inherit',
      effectiveEnabled: cfg.enabled,
      mockMode: cfg.mockMode,
      configured: !!(cfg.clientId && cfg.clientSecret),
      note: cfg.enabled
        ? cfg.mockMode
          ? 'ABDM active in MOCK mode — safe for non-India networks'
          : 'ABDM active in LIVE mode — requires India network / NHA credentials'
        : 'ABDM disabled — set ABDM_ENABLED=true or enable per-tenant via PATCH /abdm/config',
    };
  }
}
