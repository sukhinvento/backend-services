import { Injectable, Logger } from '@nestjs/common';

/**
 * AbdmMockService
 *
 * Returns realistic fake NHA gateway responses.
 * Used when ABDM_MOCK=true so the full ABDM flow can be developed
 * and tested without a real India network connection.
 *
 * All responses mirror the actual NHA sandbox response shapes so that
 * switching to live mode (ABDM_MOCK=false) requires zero code changes.
 */
@Injectable()
export class AbdmMockService {
  private readonly logger = new Logger(AbdmMockService.name);

  /** Simulated M2M access token */
  getAccessToken(): string {
    this.logger.debug('[MOCK] getAccessToken called');
    return 'mock-abdm-access-token-' + Date.now();
  }

  /** Simulated OTP generation — returns a fake txnId */
  generateAadhaarOtp(aadhaarNumber: string): { txnId: string } {
    this.logger.log(`[MOCK] generateAadhaarOtp for Aadhaar ${aadhaarNumber.slice(0, 4)}****`);
    return { txnId: `mock-txn-${Date.now()}` };
  }

  /** Simulated OTP verification — returns a fake ABHA profile */
  verifyOtpAndCreateAbha(txnId: string, otp: string): {
    abhaNumber: string;
    abhaAddress: string;
    name: string;
    mobile: string;
    gender: string;
    yearOfBirth: string;
    state: string;
  } {
    this.logger.log(`[MOCK] verifyOtpAndCreateAbha txnId=${txnId} otp=${otp}`);
    const uid = Date.now().toString().slice(-8);
    return {
      abhaNumber: `12-${uid.slice(0,4)}-${uid.slice(4,8)}-0000`,
      abhaAddress: `patient${uid}@abdm`,
      name: 'Mock Patient',
      mobile: '9999999999',
      gender: 'M',
      yearOfBirth: '1990',
      state: 'Karnataka',
    };
  }

  /** Simulated ABHA search */
  searchByAbha(abhaAddress: string): {
    healthId: string;
    healthIdNumber: string;
    name: string;
    mobile: string;
  } {
    this.logger.log(`[MOCK] searchByAbha ${abhaAddress}`);
    return {
      healthId: abhaAddress,
      healthIdNumber: '12-1234-5678-9000',
      name: 'Mock Patient',
      mobile: '9999999999',
    };
  }

  /** Simulated OTP for linking existing ABHA */
  initLinkingOtp(abhaAddress: string): { txnId: string } {
    this.logger.log(`[MOCK] initLinkingOtp for ${abhaAddress}`);
    return { txnId: `mock-link-txn-${Date.now()}` };
  }

  /** Simulated link confirmation */
  confirmLinking(txnId: string, otp: string): { status: string } {
    this.logger.log(`[MOCK] confirmLinking txnId=${txnId}`);
    return { status: 'SUCCESS' };
  }

  /** Simulated care context addition */
  addCareContext(abhaAddress: string, careContextRef: string): { status: string } {
    this.logger.log(`[MOCK] addCareContext abha=${abhaAddress} ref=${careContextRef}`);
    return { status: 'SUCCESS' };
  }

  /** Simulated consent request (for HIU role) */
  requestConsent(abhaAddress: string, purpose: string): { consentRequestId: string } {
    this.logger.log(`[MOCK] requestConsent abha=${abhaAddress} purpose=${purpose}`);
    return { consentRequestId: `mock-consent-${Date.now()}` };
  }
}
