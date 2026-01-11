/**
 * @jest-environment node
 */

import { encrypt, decrypt } from '@/lib/crypto';

// Mock environment variable
const MOCK_ENCRYPTION_KEY = 'test-encryption-key-32-characters!';

describe('Crypto Utilities', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = MOCK_ENCRYPTION_KEY;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('should encrypt text correctly', () => {
      const plainText = 'sk-test-api-key-12345';
      const encrypted = encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(':')).toHaveLength(4); // salt:iv:authTag:encrypted
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plainText = 'sk-test-api-key-12345';
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for empty text', () => {
      expect(() => encrypt('')).toThrow('암호화할 텍스트가 없습니다.');
    });

    it('should handle special characters', () => {
      const plainText = 'sk-ant-api03-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(4);
    });

    it('should handle long text', () => {
      const plainText = 'a'.repeat(1000);
      const encrypted = encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(4);
    });
  });

  describe('decrypt', () => {
    it('should decrypt text correctly', () => {
      const plainText = 'sk-test-api-key-12345';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt special characters correctly', () => {
      const plainText = 'sk-ant-api03-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt long text correctly', () => {
      const plainText = 'a'.repeat(1000);
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error for empty text', () => {
      expect(() => decrypt('')).toThrow('복호화할 텍스트가 없습니다.');
    });

    it('should throw error for invalid format', () => {
      expect(() => decrypt('invalid-format')).toThrow('잘못된 암호화 형식입니다.');
    });

    it('should throw error for tampered ciphertext', () => {
      const plainText = 'sk-test-api-key-12345';
      const encrypted = encrypt(plainText);
      const parts = encrypted.split(':');
      parts[3] = 'tampered' + parts[3].slice(8); // Tamper with encrypted data
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('encrypt and decrypt integration', () => {
    it('should round-trip various API key formats', () => {
      const apiKeys = [
        'sk-proj-abcdefghijklmnopqrstuvwxyz123456', // OpenAI
        'sk-ant-api03-abcdefghijklmnopqrstuvwxyz', // Claude
        'AIzaSyAbcdefghijklmnopqrstuvwxyz123456', // Gemini
        'xai-abcdefghijklmnopqrstuvwxyz123456789', // Grok
      ];

      apiKeys.forEach((key) => {
        const encrypted = encrypt(key);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(key);
      });
    });

    it('should handle Unicode characters', () => {
      const plainText = '한글 테스트 API 키 🔑';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });
  });
});

describe('Crypto without ENCRYPTION_KEY', () => {
  it('should throw error when ENCRYPTION_KEY is not set', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;

    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다.');

    process.env.ENCRYPTION_KEY = originalKey;
  });
});
