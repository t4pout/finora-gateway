import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import fs from 'fs';
import os from 'os';

export function createEfiPay() {
  let certificatePath: string;

  const certBase64 = process.env.EFI_CERT_BASE64;

  if (certBase64) {
    const cleaned = certBase64
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\r\n/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
      .trim();
    const certBuffer = Buffer.from(cleaned, 'base64');
    const tempPath = path.join(os.tmpdir(), 'efi_cert.p12');
    fs.writeFileSync(tempPath, certBuffer);
    certificatePath = tempPath;
  } else {
    certificatePath = path.resolve(process.cwd(), 'certs/producao-886484-finora payments.p12');
  }

  return new EfiPay({
    client_id: process.env.EFI_CLIENT_ID!,
    client_secret: process.env.EFI_CLIENT_SECRET!,
    sandbox: process.env.EFI_SANDBOX === 'true',
    certificate: certificatePath,
  });
}

export default createEfiPay();