import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import fs from 'fs';

const certBase64 = process.env.EFI_CERT_BASE64;

let certificate: string | Buffer;

if (certBase64) {
  certificate = Buffer.from(certBase64.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, ''), 'base64');
} else {
  certificate = path.resolve(process.cwd(), 'certs/producao-886484-finora payments.p12');
}

const options = {
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  sandbox: process.env.EFI_SANDBOX === 'true',
  certificate,
};

const efipay = new EfiPay(options);

export default efipay;