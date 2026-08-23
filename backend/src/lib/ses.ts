import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const client = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || undefined,
});

const SENDER = process.env.SES_SENDER_EMAIL || 'noreply@mini-onboarding.local';

export interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  await client.send(
    new SendEmailCommand({
      Source: SENDER,
      Destination: {
        ToAddresses: [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    }),
  );
}

export function buildEnrichmentCompleteEmail(
  to: string,
  businessName: string,
  documentNumber: string,
): EmailParams {
  return {
    to,
    subject: `Merchant ${businessName} - Datos enriquecidos`,
    htmlBody: `
      <h1>Datos enriquecidos correctamente</h1>
      <p>El merchant <strong>${businessName}</strong> (RUC: ${documentNumber}) ha sido enriquecido.</p>
      <p>Ya puede revisar los datos y confirmar la afiliación.</p>
      <hr>
      <p><small>Mini Onboarding - Sistema de Afiliación</small></p>
    `,
  };
}
