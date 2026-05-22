import { Schema } from 'mongoose';
import { CryptoService } from './crypto.service';

const ENCRYPTED_PATTERN = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

export interface EncryptionPluginOptions {
  cryptoService: CryptoService;
  fields: string[];
}

function isEncrypted(value: string): boolean {
  return ENCRYPTED_PATTERN.test(value);
}

function decryptDoc(doc: any, fields: string[], cryptoService: CryptoService): void {
  if (!doc) return;
  for (const field of fields) {
    const value = doc[field];
    if (typeof value === 'string' && value.length > 0 && isEncrypted(value)) {
      try {
        doc[field] = cryptoService.decrypt(value);
      } catch {
        // Leave as-is if decryption fails
      }
    }
  }
}

/**
 * Mongoose plugin that transparently encrypts/decrypts PII fields using AES-256-GCM.
 *
 * - pre('save'): encrypts each field in options.fields if not already encrypted;
 *   also sets `${field}_search_hash` via HMAC for searchable lookup without exposing plaintext.
 * - post('find'), post('findOne'), post('findOneAndUpdate'): decrypts the same fields on results.
 */
export function encryptionPlugin(
  schema: Schema,
  options: EncryptionPluginOptions,
): void {
  const { cryptoService, fields } = options;

  schema.pre('save', function (next) {
    for (const field of fields) {
      const value = (this as any)[field];
      if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
        (this as any)[`${field}_search_hash`] = cryptoService.hmac(value);
        (this as any)[field] = cryptoService.encrypt(value);
      }
    }
    next();
  });

  schema.post('find', function (docs: any[]) {
    if (!Array.isArray(docs)) return;
    for (const doc of docs) {
      decryptDoc(doc, fields, cryptoService);
    }
  });

  schema.post('findOne', function (doc: any) {
    decryptDoc(doc, fields, cryptoService);
  });

  schema.post('findOneAndUpdate', function (doc: any) {
    decryptDoc(doc, fields, cryptoService);
  });
}
