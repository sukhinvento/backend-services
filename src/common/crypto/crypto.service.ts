import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedValue {
  iv: string;
  authTag: string;
  ciphertext: string;
}

const ENCRYPTED_PATTERN = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

@Injectable()
export class CryptoService {
  private readonly encryptionKey: Buffer;
  private readonly hmacKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const hmacKeyHex = this.configService.get<string>('ENCRYPTION_HMAC_KEY');

    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    if (!hmacKeyHex || hmacKeyHex.length !== 64) {
      throw new Error('ENCRYPTION_HMAC_KEY must be a 64-character hex string (32 bytes)');
    }

    this.encryptionKey = Buffer.from(keyHex, 'hex');
    this.hmacKey = Buffer.from(hmacKeyHex, 'hex');
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex-encoded).
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts a string in `iv:authTag:ciphertext` format (all hex).
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format — expected iv:authTag:ciphertext');
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  /**
   * Computes HMAC-SHA256 of a value for use as a searchable index on encrypted fields.
   * Returns hex-encoded digest.
   */
  hmac(value: string): string {
    return crypto.createHmac('sha256', this.hmacKey).update(value, 'utf8').digest('hex');
  }

  /**
   * Shallow-encrypts the specified fields of an object in place (returns a new object).
   */
  encryptObject(obj: Record<string, any>, fields: string[]): Record<string, any> {
    const result = { ...obj };
    for (const field of fields) {
      const value = result[field];
      if (typeof value === 'string' && value.length > 0 && !ENCRYPTED_PATTERN.test(value)) {
        result[field] = this.encrypt(value);
      }
    }
    return result;
  }

  /**
   * Shallow-decrypts the specified fields of an object in place (returns a new object).
   */
  decryptObject(obj: Record<string, any>, fields: string[]): Record<string, any> {
    const result = { ...obj };
    for (const field of fields) {
      const value = result[field];
      if (typeof value === 'string' && value.length > 0 && ENCRYPTED_PATTERN.test(value)) {
        try {
          result[field] = this.decrypt(value);
        } catch {
          // Leave the value as-is if decryption fails (e.g. not actually encrypted)
        }
      }
    }
    return result;
  }
}
