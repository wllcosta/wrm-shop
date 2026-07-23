import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatBRL, formatPct } from '../utils/format';

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboard(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Visão geral</div>
          <h1>Dashboard</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!data && !error && <p style={{ color: 'var(--text-dim)' }}>Carregando...</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Faturamento" value={formatBRL(data.revenue)} />
            <StatCard label="Lucro" value={formatBRL(data.profit)} accent />
            <StatCard label="Margem" value={formatPct(data.margin)} />
            <StatCard label="Unidades vendidas" value={data.units} />
          </div>

          {data.bestProduct && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="eyebrow">Produto mais lucrativo</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{data.bestProduct.name}</div>
              <div className="mono" style={{ color: 'var(--success)' }}>{formatBRL(data.bestProduct.profit)} de lucro acumulado</div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Faturamento por canal</h3>
            {Object.keys(data.revenueByChannel).length === 0 && (
              <p style={{ color: 'var(--text-dim)' }}>Nenhuma venda registrada ainda.</p>
            )}
            {Object.entries(data.revenueByChannel).map(([channel, revenue]) => (
              <div key={channel} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{channel}</span>
                <span className="mono">{formatBRL(revenue)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card">
      <div className="eyebrow">{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}
