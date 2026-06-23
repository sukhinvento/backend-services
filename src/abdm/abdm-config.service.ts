import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../tenants/schemas/tenant.schema';

export interface AbdmConfig {
  enabled: boolean;
  mockMode: boolean;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  hfrId: string;
}

/**
 * AbdmConfigService
 *
 * Resolves ABDM feature-flag state with three layers (lowest to highest priority):
 *   1. Environment variable  ABDM_ENABLED  (global default)
 *   2. Tenant-level override stored in tenant.config.abdm_enabled
 *   3. Runtime check (ABDM_CLIENT_ID must be set for live mode)
 *
 * When ABDM_ENABLED=false the entire ABDM module operates in no-op mode —
 * every API call returns a { enabled: false } stub without hitting the NHA gateway.
 */
@Injectable()
export class AbdmConfigService {
  private readonly logger = new Logger(AbdmConfigService.name);
  private readonly globalEnabled: boolean;
  private readonly mockMode: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Tenant.name) private tenantModel: Model<any>,
  ) {
    this.globalEnabled = config.get<string>('ABDM_ENABLED') === 'true';
    this.mockMode = config.get<string>('ABDM_MOCK') !== 'false'; // default true
    this.logger.log(
      `ABDM global: enabled=${this.globalEnabled}, mock=${this.mockMode}`,
    );
  }

  /** Returns the resolved AbdmConfig for a given tenant. */
  async getConfig(tenantId: string): Promise<AbdmConfig> {
    // Use raw collection query to handle both:
    //   - old seeded tenants where _id === tenantId (string)
    //   - new tenants where tenantId is a separate field
    const tenant: any = await this.tenantModel.collection.findOne(
      { $or: [{ tenantId }, { _id: tenantId as any }] } as any,
    );

    // Per-tenant override wins if set; falls back to global env
    const tenantEnabled: boolean | undefined = tenant?.config?.abdm_enabled;
    const enabled = tenantEnabled !== undefined ? tenantEnabled : this.globalEnabled;

    const isMock =
      tenant?.config?.abdm_mock !== undefined
        ? tenant.config.abdm_mock
        : this.mockMode;

    const sandboxUrl = this.config.get<string>('ABDM_SANDBOX_URL') ??
      'https://dev.abdm.gov.in/gateway';
    const prodUrl = this.config.get<string>('ABDM_PROD_URL') ??
      'https://live.abdm.gov.in/gateway';

    return {
      enabled,
      mockMode: isMock,
      baseUrl: isMock ? sandboxUrl : prodUrl,
      clientId: this.config.get<string>('ABDM_CLIENT_ID') ?? '',
      clientSecret: this.config.get<string>('ABDM_CLIENT_SECRET') ?? '',
      hfrId: this.config.get<string>('ABDM_HFR_ID') ?? '',
    };
  }

  /** Quick boolean check — use in guards before any ABDM operation. */
  async isEnabled(tenantId: string): Promise<boolean> {
    const cfg = await this.getConfig(tenantId);
    return cfg.enabled;
  }

  /** Returns global mock flag without tenant lookup (for module init). */
  get isMockGlobal(): boolean {
    return this.mockMode;
  }
}
