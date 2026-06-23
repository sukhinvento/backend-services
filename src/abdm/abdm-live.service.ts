import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AbdmConfig } from './abdm-config.service';

/**
 * AbdmLiveService
 *
 * Wraps all real NHA Gateway API calls.
 * Only instantiated and called when ABDM_MOCK=false.
 *
 * Sandbox: https://dev.abdm.gov.in/gateway  (requires India IP or VPN)
 * Production: https://live.abdm.gov.in/gateway
 *
 * Register at: https://sandbox.abdm.gov.in/
 * NHA support: abdm@nha.gov.in
 */
@Injectable()
export class AbdmLiveService {
  private readonly logger = new Logger(AbdmLiveService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  /** Get M2M access token (cached, refreshed 60s before expiry) */
  async getAccessToken(cfg: AbdmConfig): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token;
    }

    const res = await this.post(cfg, '/v0.5/sessions', {
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
    });

    this.tokenCache = {
      token: res.accessToken,
      expiresAt: now + (res.expiresIn ?? 3600) * 1000,
    };
    return res.accessToken;
  }

  async generateAadhaarOtp(cfg: AbdmConfig, aadhaarNumber: string): Promise<{ txnId: string }> {
    const token = await this.getAccessToken(cfg);
    return this.post(cfg, '/v1/registration/aadhaar/generateOtp',
      { aadhaar: aadhaarNumber }, token);
  }

  async verifyOtpAndCreateAbha(cfg: AbdmConfig, txnId: string, otp: string): Promise<{
    abhaNumber: string; abhaAddress: string; name: string;
    mobile: string; gender: string; yearOfBirth: string; state: string;
  }> {
    const token = await this.getAccessToken(cfg);
    const res = await this.post(cfg, '/v1/registration/aadhaar/verifyOtp',
      { txnId, otp }, token);
    return {
      abhaNumber: res.healthIdNumber,
      abhaAddress: res.healthId,
      name: res.name,
      mobile: res.mobile,
      gender: res.gender,
      yearOfBirth: res.yearOfBirth,
      state: res.stateName,
    };
  }

  async searchByAbha(cfg: AbdmConfig, abhaAddress: string): Promise<{
    healthId: string; healthIdNumber: string; name: string; mobile: string;
  }> {
    const token = await this.getAccessToken(cfg);
    return this.post(cfg, '/v1/search/searchByHealthId',
      { healthId: abhaAddress }, token);
  }

  async initLinkingOtp(cfg: AbdmConfig, abhaAddress: string): Promise<{ txnId: string }> {
    const token = await this.getAccessToken(cfg);
    return this.post(cfg, '/v1/users/auth/init',
      { authMethod: 'MOBILE_OTP', healthid: abhaAddress }, token);
  }

  async confirmLinking(cfg: AbdmConfig, txnId: string, otp: string): Promise<{ status: string }> {
    const token = await this.getAccessToken(cfg);
    return this.post(cfg, '/v1/users/auth/confirm',
      { txnId, credential: { authCode: otp } }, token);
  }

  async addCareContext(
    cfg: AbdmConfig,
    abhaAddress: string,
    careContextRef: string,
    careContextDisplay: string,
  ): Promise<{ status: string }> {
    const token = await this.getAccessToken(cfg);
    return this.post(cfg, '/v0.5/links/link/add-context', {
      patient: {
        id: abhaAddress,
        careContexts: [{ referenceNumber: careContextRef, display: careContextDisplay }],
      },
    }, token);
  }

  /** POST helper with error wrapping */
  private async post(
    cfg: AbdmConfig,
    path: string,
    body: Record<string, any>,
    token?: string,
  ): Promise<any> {
    const url = `${cfg.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CM-ID': 'sbx', // Sandbox CM-ID; production: 'abdm'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`ABDM API error ${res.status} on ${path}: ${err}`);
        throw new InternalServerErrorException(`ABDM API error: ${res.status}`);
      }

      return res.json();
    } catch (err) {
      this.logger.error(`ABDM network error on ${path}`, err);
      throw new InternalServerErrorException(
        'ABDM gateway unreachable. Ensure you are on India network or VPN.'
      );
    }
  }
}
