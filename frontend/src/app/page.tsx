'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { api, type Merchant } from '../lib/api';

type View = 'home' | 'login' | 'dashboard' | 'merchants-new' | 'merchants-detail';

// ====================== APP ROOT ======================

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && (view === 'home' || view === 'login')) {
      setView('dashboard');
    }
  }, [isAuthenticated, isLoading, view]);

  if (isLoading) return <Shell><p>Cargando...</p></Shell>;

  const goToDetail = (id: string) => {
    setSelectedMerchantId(id);
    setView('merchants-detail');
  };

  return (
    <Shell>
      {!isAuthenticated && view === 'home' && <Home onLogin={() => setView('login')} />}
      {!isAuthenticated && view === 'login' && <LoginPage onBack={() => setView('home')} />}
      {isAuthenticated && view === 'dashboard' && (
        <Dashboard
          onNew={() => setView('merchants-new')}
          onDetail={goToDetail}
        />
      )}
      {isAuthenticated && view === 'merchants-new' && (
        <MerchantNewPage onBack={() => setView('dashboard')} />
      )}
      {isAuthenticated && view === 'merchants-detail' && selectedMerchantId && (
        <MerchantDetailPage merchantId={selectedMerchantId} onBack={() => setView('dashboard')} />
      )}
    </Shell>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// ====================== SHELL ======================

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="container">
      {children}
    </main>
  );
}

// ====================== HOME ======================

function Home({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="hero">
      <h1>Mini Onboarding</h1>
      <p>Plataforma de afiliación de comercios</p>
      <button onClick={onLogin} className="button">Iniciar sesión</button>
    </section>
  );
}

// ====================== LOGIN ======================

function LoginPage({ onBack }: { onBack: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="form-section">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email" id="email" placeholder="tu@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password" id="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required disabled={isLoading}
          />
        </div>
        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="form-footer">
        <button onClick={onBack} className="button-link">← Volver al inicio</button>
      </p>
    </section>
  );
}

// ====================== DASHBOARD ======================

const POLL_MS = 10_000;
const PENDING = new Set(['pending_enrichment', 'enriching']);

function Dashboard({ onNew, onDetail }: { onNew: () => void; onDetail: (id: string) => void }) {
  const { user, tokens, logout } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMerchants = useCallback(async () => {
    try {
      const data = await api.get<Merchant[]>('/merchants', tokens?.accessToken);
      setMerchants(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar merchants');
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.accessToken]);

  useEffect(() => { if (tokens?.accessToken) fetchMerchants(); }, [fetchMerchants, tokens?.accessToken]);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    if (!merchants.some((m) => PENDING.has(m.status))) return;
    const id = setInterval(fetchMerchants, POLL_MS);
    return () => clearInterval(id);
  }, [fetchMerchants, tokens?.accessToken, merchants]);

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Hola, {user?.email}</span>
          <button onClick={logout} className="button button-secondary">Cerrar sesión</button>
        </div>
      </header>

      <section className="merchants-section">
        <div className="section-header">
          <h2>Mis Merchants</h2>
          <button onClick={onNew} className="button button-primary">+ Crear Merchant</button>
        </div>

        {isLoading && <p>Cargando merchants...</p>}
        {error && <div className="error-message">{error}</div>}

        {!isLoading && merchants.length === 0 && (
          <p>No tienes merchants registrados. <button onClick={onNew} className="button-link">Crear uno</button></p>
        )}

        {!isLoading && merchants.length > 0 && (
          <table className="merchants-table">
            <thead>
              <tr>
                <th>ID</th><th>Tipo</th><th>Documento</th><th>Nombre</th><th>Estado</th><th>Creado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id}>
                  <td>{m.id.substring(0, 15)}...</td>
                  <td>{m.documentType}</td>
                  <td>{m.documentNumber}</td>
                  <td>{m.businessName || '-'}</td>
                  <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td><button onClick={() => onDetail(encodeURIComponent(m.id))} className="button button-small">Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

// ====================== MERCHANT NEW ======================

function MerchantNewPage({ onBack }: { onBack: () => void }) {
  const { tokens } = useAuth();
  const [documentType, setDocumentType] = useState('ruc');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/merchants', { documentType, documentNumber }, tokens?.accessToken);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear merchant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="form-section">
      <header className="detail-header">
        <h1>Crear Merchant</h1>
        <button onClick={onBack} className="button button-secondary">← Volver</button>
      </header>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Tipo de documento</label>
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="ruc">RUC</option>
            <option value="dni">DNI</option>
            <option value="ce">CE</option>
          </select>
        </div>
        <div className="form-group">
          <label>Número de documento</label>
          <input
            type="text" placeholder="Ej: 20123456789"
            value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)}
            required disabled={isLoading}
          />
        </div>
        <button type="submit" className="button button-primary" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Merchant'}
        </button>
      </form>
    </section>
  );
}

// ====================== MERCHANT DETAIL ======================

function MerchantDetailPage({ merchantId, onBack }: { merchantId: string; onBack: () => void }) {
  const { tokens } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const data = await api.get<Merchant>(`/merchants/${merchantId}`, tokens?.accessToken);
        setMerchant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar merchant');
      } finally {
        setIsLoading(false);
      }
    };
    if (tokens?.accessToken && merchantId) fetchMerchant();
  }, [tokens?.accessToken, merchantId]);

  const handleConfirm = async () => {
    if (!merchant) return;
    setIsConfirming(true);
    try {
      const updated = await api.put<Merchant>(`/merchants/${merchantId}`, { status: 'submitted' }, tokens?.accessToken);
      setMerchant(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <section className="merchant-detail">
      <header className="detail-header">
        <h1>Detalle del Merchant</h1>
        <button onClick={onBack} className="button button-secondary">← Volver</button>
      </header>
      {isLoading && <p>Cargando...</p>}
      {error && <div className="error-message">{error}</div>}
      {!isLoading && merchant && (
        <div className="merchant-info">
          <div className="info-row"><label>ID:</label><span>{merchant.id}</span></div>
          <div className="info-row"><label>Tipo:</label><span>{merchant.documentType.toUpperCase()}</span></div>
          <div className="info-row"><label>Documento:</label><span>{merchant.documentNumber}</span></div>
          <div className="info-row"><label>Nombre:</label><span>{merchant.businessName || '-'}</span></div>
          <div className="info-row"><label>Email:</label><span>{merchant.email || '-'}</span></div>
          <div className="info-row"><label>Estado:</label><span className={`status-badge status-${merchant.status}`}>{merchant.status}</span></div>
          <div className="info-row"><label>Creado:</label><span>{new Date(merchant.createdAt).toLocaleString()}</span></div>
          <div className="info-row"><label>Actualizado:</label><span>{new Date(merchant.updatedAt).toLocaleString()}</span></div>
          {merchant.status === 'ready_to_submit' && (
            <div className="actions">
              <button onClick={handleConfirm} className="button button-primary" disabled={isConfirming}>
                {isConfirming ? 'Confirmando...' : 'Confirmar Merchant'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
