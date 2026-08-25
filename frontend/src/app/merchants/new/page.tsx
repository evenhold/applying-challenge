'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api';

function NewMerchantContent() {
  const [documentType, setDocumentType] = useState<'ruc' | 'dni' | 'ce'>('ruc');
  const [documentNumber, setDocumentNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { tokens } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/merchants', { documentType, documentNumber }, tokens?.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear merchant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <section className="form-section">
        <h1>Crear Merchant</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="documentType">Tipo de documento</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as 'ruc' | 'dni' | 'ce')}
              disabled={isLoading}
            >
              <option value="ruc">RUC</option>
              <option value="dni">DNI</option>
              <option value="ce">CE</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="documentNumber">Número de documento</label>
            <input
              type="text"
              id="documentNumber"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={documentType === 'ruc' ? '20123456789' : documentType === 'dni' ? '12345678' : '123456789012'}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear Merchant'}
          </button>
        </form>
        <p className="form-footer">
          <a href="/dashboard/">← Volver al dashboard</a>
        </p>
      </section>
    </main>
  );
}

export default function NewMerchantPage() {
  return (
    <ProtectedRoute>
      <NewMerchantContent />
    </ProtectedRoute>
  );
}
