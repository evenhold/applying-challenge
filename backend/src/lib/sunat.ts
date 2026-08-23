import type { DocumentType } from '../types/index.js';

export interface SunatResponse {
  businessName: string;
  address: string;
  email: string;
  phone: string;
  status: 'valid' | 'invalid';
}

const MOCK_DELAY_MIN_MS = 1000;
const MOCK_DELAY_MAX_MS = 5000;

const MOCK_RUC_DATA: Record<string, SunatResponse> = {
  '20123456786': {
    businessName: 'Empresa ABC SAC',
    address: 'Av. Principal 123, San Isidro, Lima',
    email: 'contacto@abc.com',
    phone: '014567890',
    status: 'valid',
  },
  '20987654321': {
    businessName: 'Tech Corp SAC',
    address: 'Calle Jr. de la Unión 456, Cercado, Lima',
    email: 'info@techcorp.com',
    phone: '012345678',
    status: 'valid',
  },
  '20111222333': {
    businessName: 'Exportaciones Peru SRL',
    address: 'Av. Larco 789, Miraflores, Lima',
    email: 'ventas@exportperu.com',
    phone: '016543210',
    status: 'valid',
  },
};

const MOCK_DNI_DATA: Record<string, SunatResponse> = {
  '12345678': {
    businessName: 'Juan Perez',
    address: 'Av. Lima 123, San Isidro, Lima',
    email: 'juan@test.com',
    phone: '999888777',
    status: 'valid',
  },
  '87654321': {
    businessName: 'Maria Garcia',
    address: 'Calle Main 456, Miraflores, Lima',
    email: 'maria@test.com',
    phone: '988777666',
    status: 'valid',
  },
};

function getRandomDelay(): number {
  return (
    Math.floor(Math.random() * (MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS + 1)) + MOCK_DELAY_MIN_MS
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function querySunat(
  documentType: DocumentType,
  documentNumber: string,
): Promise<SunatResponse> {
  const randomDelay = getRandomDelay();
  await delay(randomDelay);

  const mockData =
    documentType === 'ruc' ? MOCK_RUC_DATA[documentType] : MOCK_DNI_DATA[documentType];

  if (documentType === 'ruc') {
    const data = MOCK_RUC_DATA[documentNumber];
    if (!data) {
      return {
        businessName: '',
        address: '',
        email: '',
        phone: '',
        status: 'invalid',
      };
    }
    return data;
  }

  if (documentType === 'dni') {
    const data = MOCK_DNI_DATA[documentNumber];
    if (!data) {
      return {
        businessName: '',
        address: '',
        email: '',
        phone: '',
        status: 'invalid',
      };
    }
    return data;
  }

  return {
    businessName: `Persona ${documentNumber}`,
    address: `Direccion ${documentNumber}, Lima`,
    email: `user${documentNumber}@test.com`,
    phone: '999000111',
    status: 'valid',
  };
}
