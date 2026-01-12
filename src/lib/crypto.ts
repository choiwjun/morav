import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_SECRET_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return key;
}

function deriveKey(salt: Buffer): Buffer {
  const password = getEncryptionKey();
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

export function encrypt(text: string): string {
  if (!text) {
    throw new Error('암호화할 텍스트가 없습니다.');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: salt:iv:authTag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('복호화할 텍스트가 없습니다.');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('잘못된 암호화 형식입니다.');
  }

  const [saltHex, ivHex, authTagHex, encrypted] = parts;

  // Hex 형식 검증
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(saltHex) || !hexRegex.test(ivHex) || !hexRegex.test(authTagHex) || !hexRegex.test(encrypted)) {
    throw new Error('잘못된 암호화 데이터입니다.');
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // 인증 태그 불일치 또는 데이터 손상
    if (error instanceof Error) {
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('데이터가 손상되었거나 위변조되었습니다.');
      }
      if (error.message.includes('Invalid key length')) {
        throw new Error('암호화 키가 올바르지 않습니다.');
      }
    }
    throw new Error('복호화에 실패했습니다.');
  }
}
