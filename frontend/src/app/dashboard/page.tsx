'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

interface Merchant {
  id: string;
  documentType: string;
  documentNumber: string;
  businessName: string;
  status: string;
  createdAt: string;
}

function DashboardContent() {
  const { user, tokens, logout } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch('http://localhost:3001/merchants', {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar merchants');
        }

        const data = await response.json();
        setMerchants(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar merchants');
      } finally {
        setIsLoading(false);
      }
    };

    if (tokens?.accessToken) {
      fetchMerchants();
    }
  }, [tokens?.accessToken]);

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
          <h2>Mis Merchants</h2>

          {isLoading && <p>Cargando merchants...</p>}

          {error && <div className="error-message">{error}</div>}

          {!isLoading && merchants.length === 0 && (
            <p>No tienes merchants registrados.</p>
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
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>{merchant.id}</td>
                    <td>{merchant.documentType}</td>
                    <td>{merchant.documentNumber}</td>
                    <td>{merchant.businessName || '-'}</td>
                    <td>{merchant.status}</td>
                    <td>{new Date(merchant.createdAt).toLocaleDateString()}</td>
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
