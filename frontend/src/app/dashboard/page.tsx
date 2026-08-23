'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api, type Merchant } from '../../lib/api';

const POLL_INTERVAL_MS = 10_000;
const PENDING_STATUSES = new Set(['pending_enrichment', 'enriching']);

function DashboardContent() {
  const { user, tokens, logout } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMerchants = async () => {
    try {
      const data = await api.get<Merchant[]>('/merchants', tokens?.accessToken);
      setMerchants(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar merchants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchMerchants();
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    if (!merchants.some((m) => PENDING_STATUSES.has(m.status))) return;

    const id = setInterval(fetchMerchants, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tokens?.accessToken, merchants]);

  return (
    <main className="container">
      <section className="dashboard">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Hola, {user?.email}</span>
            <button onClick={logout} className="button button-secondary">
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="merchants-section">
          <div className="section-header">
            <h2>Mis Merchants</h2>
            <Link href="/merchants/new" className="button button-primary">
              + Crear Merchant
            </Link>
          </div>

          {isLoading && <p>Cargando merchants...</p>}

          {error && <div className="error-message">{error}</div>}

          {!isLoading && merchants.length === 0 && (
            <p>No tienes merchants registrados. <Link href="/merchants/new">Crear uno</Link></p>
          )}

          {!isLoading && merchants.length > 0 && (
            <table className="merchants-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>{merchant.id.substring(0, 15)}...</td>
                    <td>{merchant.documentType}</td>
                    <td>{merchant.documentNumber}</td>
                    <td>{merchant.businessName || '-'}</td>
                    <td>
                      <span className={`status-badge status-${merchant.status}`}>
                        {merchant.status}
                      </span>
                    </td>
                    <td>{new Date(merchant.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/merchants/${encodeURIComponent(merchant.id)}`} className="button button-small">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
