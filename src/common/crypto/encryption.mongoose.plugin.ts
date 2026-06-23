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
        // Leave as-is if decryption fails (corrupted or old plaintext)
      }
    }
  }
}

/**
 * Mongoose plugin that transparently encrypts/decrypts PII fields using AES-256-GCM.
 *
 * Encryption:
 *   - pre('save')              — new documents and full saves
 *   - pre('findOneAndUpdate')  — partial updates via findByIdAndUpdate / findOneAndUpdate
 *
 * For each encrypted field, an HMAC-SHA256 search hash (`${field}_search_hash`) is also
 * maintained so records can be searched without exposing plaintext.
 *
 * Decryption:
 *   - post('find'), post('findOne'), post('findOneAndUpdate')
 */
export function encryptionPlugin(
  schema: Schema,
  options: EncryptionPluginOptions,
): void {
  const { cryptoService, fields } = options;

  // --- Encrypt on save (new records + full replaces) ---
  schema.pre('save', function (next) {
    for (const field of fields) {
      const value = (this as any)[field];
      if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
        (this as any)[`${field}_search_hash`] = cryptoService.hmac(value.toLowerCase().trim());
        (this as any)[field] = cryptoService.encrypt(value);
      }
    }
    next();
  });

  // --- Encrypt on patch updates (findByIdAndUpdate, findOneAndUpdate) ---
  schema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;
    if (!update) return next();

    // Updates can come in as `{ field: val }` or `{ $set: { field: val } }`
    const target = update.$set ?? update;

    for (const field of fields) {
      const value = target[field];
      if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
        const hashKey = `${field}_search_hash`;
        if (update.$set) {
          update.$set[field] = cryptoService.encrypt(value);
          update.$set[hashKey] = cryptoService.hmac(value.toLowerCase().trim());
        } else {
          update[field] = cryptoService.encrypt(value);
          update[hashKey] = cryptoService.hmac(value.toLowerCase().trim());
        }
      }
    }
    next();
  });

  // --- Decrypt after reads ---
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
