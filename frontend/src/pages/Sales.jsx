import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatBRL, formatPct } from '../utils/format';

const emptyForm = { productId: '', channelId: '', price: '', qty: '1', saleDate: '' };

export default function Sales() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function loadAll() {
    Promise.all([api.getProducts(token), api.getChannels(token), api.getSales(token)])
      .then(([p, c, s]) => {
        setProducts(p);
        setChannels(c);
        setSales(s);
        setForm((f) => ({ ...f, productId: f.productId || p[0]?.id || '', channelId: f.channelId || c[0]?.id || '' }));
      })
      .catch((err) => setError(err.message));
  }

  useEffect(loadAll, [token]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createSale(token, {
        productId: form.productId,
        channelId: form.channelId,
        price: Number(form.price),
        qty: Number(form.qty) || 1,
        saleDate: form.saleDate || undefined,
      });
      setForm((f) => ({ ...f, price: '', qty: '1' }));
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta venda?')) return;
    await api.deleteSale(token, id);
    loadAll();
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Vendas</div>
          <h1>Registro de vendas</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Nova venda</h3>
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Cadastre um produto na Calculadora antes de registrar vendas.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Produto</label>
                <select value={form.productId} onChange={(e) => update('productId', e.target.value)} required>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="field">
                <label>Canal de venda</label>
                <select value={form.channelId} onChange={(e) => update('channelId', e.target.value)} required>
                  {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Preço de venda (unitário)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} required />
                </div>
                <div className="field" style={{ width: 100 }}>
                  <label>Qtd</label>
                  <input type="number" min="1" step="1" value={form.qty} onChange={(e) => update('qty', e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Data (opcional, padrão hoje)</label>
                <input type="date" value={form.saleDate} onChange={(e) => update('saleDate', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Registrando...' : 'Registrar venda'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Histórico</h3>
        {sales.length === 0 && <p style={{ color: 'var(--text-dim)' }}>Nenhuma venda registrada ainda.</p>}
        {sales.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Produto</th><th>Canal</th><th>Qtd</th><th>Preço</th><th>Lucro</th><th>Margem</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleDateString('pt-BR')}</td>
                  <td>{s.product_name}</td>
                  <td>{s.channel_name}</td>
                  <td className="mono">{s.qty}</td>
                  <td className="mono">{formatBRL(s.price)}</td>
                  <td className="mono">{formatBRL(s.profit)}</td>
                  <td className="mono">{formatPct(s.margin)}</td>
                  <td><button className="btn btn-ghost" onClick={() => handleDelete(s.id)}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
