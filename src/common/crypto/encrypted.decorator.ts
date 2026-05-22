import 'reflect-metadata';

export const ENCRYPTED_FIELDS_KEY = 'pii:encrypted_fields';

/**
 * Property decorator that marks a field as PII-encrypted.
 * The field name is stored in Reflect.metadata under ENCRYPTED_FIELDS_KEY on the class prototype.
 */
export function Encrypted(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: string[] = Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target) ?? [];
    existing.push(propertyKey as string);
    Reflect.defineMetadata(ENCRYPTED_FIELDS_KEY, existing, target);
  };
}

/**
 * Retrieves the list of encrypted field names for a given class target.
 */
export function getEncryptedFields(target: any): string[] {
  return Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target) ?? [];
}
