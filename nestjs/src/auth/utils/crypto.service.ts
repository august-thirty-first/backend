import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly ENCRYPTION_KEY: string;
  private readonly IV_LENGTH: number = 16;

  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      throw new TypeError(
        'ENCRYPTION_KEY 가 .env에 설정되어 있어야 합니다. .env파일을 update 해주세요.',
      );
    }
    this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY),
      iv,
    );
    const encrypted = cipher.update(text);

    return (
      iv.toString('hex') +
      ':' +
      Buffer.concat([encrypted, cipher.final()]).toString('hex')
    );
  }

  decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY),
      iv,
    );
    const decrypted = decipher.update(encryptedText);

    return Buffer.concat([decrypted, decipher.final()]).toString();
  }
}
