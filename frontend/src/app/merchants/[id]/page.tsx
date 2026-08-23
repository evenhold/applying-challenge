'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

interface Merchant {
  id: string;
  documentType: string;
  documentNumber: string;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  sellerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function MerchantDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { tokens } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const merchantId = params.id as string;

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const response = await fetch(`/api/merchants/${merchantId}`, {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar merchant');
        }

        const data = await response.json();
        setMerchant(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar merchant');
      } finally {
        setIsLoading(false);
      }
    };

    if (tokens?.accessToken && merchantId) {
      fetchMerchant();
    }
  }, [tokens?.accessToken, merchantId]);

  const handleConfirm = async () => {
    if (!merchant) return;

    setIsConfirming(true);
    setError('');

    try {
      const response = await fetch(`/api/merchants/${merchantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          status: 'submitted',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al confirmar merchant');
      }

      setMerchant({ ...merchant, status: 'submitted' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar merchant');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="container">
      <section className="merchant-detail">
        <header className="detail-header">
          <h1>Detalle del Merchant</h1>
          <button onClick={() => router.push('/dashboard')} className="button button-secondary">
            ← Volver
          </button>
        </header>

        {isLoading && <p>Cargando merchant...</p>}

        {error && <div className="error-message">{error}</div>}

        {!isLoading && merchant && (
          <div className="merchant-info">
            <div className="info-row">
              <label>ID:</label>
              <span>{merchant.id}</span>
            </div>
            <div className="info-row">
              <label>Tipo de documento:</label>
              <span>{merchant.documentType.toUpperCase()}</span>
            </div>
            <div className="info-row">
              <label>Número de documento:</label>
              <span>{merchant.documentNumber}</span>
            </div>
            <div className="info-row">
              <label>Nombre del negocio:</label>
              <span>{merchant.businessName || '-'}</span>
            </div>
            <div className="info-row">
              <label>Dirección:</label>
              <span>{merchant.address || '-'}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{merchant.email || '-'}</span>
            </div>
            <div className="info-row">
              <label>Teléfono:</label>
              <span>{merchant.phone || '-'}</span>
            </div>
            <div className="info-row">
              <label>Estado:</label>
              <span className={`status-badge status-${merchant.status}`}>{merchant.status}</span>
            </div>
            <div className="info-row">
              <label>Creado:</label>
              <span>{new Date(merchant.createdAt).toLocaleString()}</span>
            </div>
            <div className="info-row">
              <label>Actualizado:</label>
              <span>{new Date(merchant.updatedAt).toLocaleString()}</span>
            </div>

            {merchant.status === 'ready_to_submit' && (
              <div className="actions">
                <button
                  onClick={handleConfirm}
                  className="button button-primary"
                  disabled={isConfirming}
                >
                  {isConfirming ? 'Confirmando...' : 'Confirmar Merchant'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function MerchantDetailPage() {
  return (
    <ProtectedRoute>
      <MerchantDetailContent />
    </ProtectedRoute>
  );
}
