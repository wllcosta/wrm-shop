import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatBRL, filamentColor } from '../utils/format';

export default function Settings() {
  const { token } = useAuth();
  const [filaments, setFilaments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState(null);
  const [newFil, setNewFil] = useState({ name: '', price_per_kg: '' });

  function loadAll() {
    Promise.all([api.getFilamentTypes(token), api.getSettings(token), api.getChannels(token)])
      .then(([f, s, c]) => { setFilaments(f); setSettings(s); setChannels(c); })
      .catch((err) => setError(err.message));
  }

  useEffect(loadAll, [token]);

  async function handleAddFilament(e) {
    e.preventDefault();
    if (!newFil.name || !newFil.price_per_kg) return;
    try {
      await api.createFilamentType(token, { name: newFil.name.trim(), price_per_kg: Number(newFil.price_per_kg) });
      setNewFil({ name: '', price_per_kg: '' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePriceChange(id, value) {
    setFilaments((list) => list.map((f) => (f.id === id ? { ...f, price_per_kg: value } : f)));
  }

  async function handlePriceSave(id, value) {
    try {
      await api.updateFilamentType(token, id, { price_per_kg: Number(value) });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteFilament(id) {
    if (!confirm('Remover este tipo de filamento?')) return;
    try {
      await api.deleteFilamentType(token, id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSettingsSave(field, value) {
    try {
      const updated = await api.updateSettings(token, { [field]: value });
      setSettings(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Configurações</div>
          <h1>Parâmetros do sistema</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Tipos de filamento</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
          O preço por kg de cada tipo entra direto no cálculo de custo das peças.
        </p>

        <table style={{ marginBottom: 16 }}>
          <thead><tr><th>Filamento</th><th>Preço por kg</th><th></th></tr></thead>
          <tbody>
            {filaments.map((f) => (
              <tr key={f.id}>
                <td>
                  <span className="fil-chip">
                    <span className="fil-dot" style={{ background: filamentColor(f.name) }} />
                    {f.name}
                  </span>
                </td>
                <td>
                  <input
                    type="number" step="0.01" className="mono"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, width: 110 }}
                    value={f.price_per_kg}
                    onChange={(e) => handlePriceChange(f.id, e.target.value)}
                    onBlur={(e) => handlePriceSave(f.id, e.target.value)}
                  />
                </td>
                <td><button className="btn btn-ghost" onClick={() => handleDeleteFilament(f.id)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleAddFilament} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label>Novo tipo (ex: TPU, Nylon...)</label>
            <input value={newFil.name} onChange={(e) => setNewFil((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0, width: 140 }}>
            <label>Preço/kg</label>
            <input type="number" step="0.01" value={newFil.price_per_kg} onChange={(e) => setNewFil((f) => ({ ...f, price_per_kg: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary">Adicionar</button>
        </form>
      </div>

      {settings && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Parâmetros gerais</h3>
          <div className="grid-2">
            <SettingField label="Tarifa de energia (R$/kWh)" value={settings.energy_rate} onSave={(v) => handleSettingsSave('energy_rate', v)} />
            <SettingField label="Potência da impressora (W)" value={settings.power_watts} onSave={(v) => handleSettingsSave('power_watts', v)} />
            <SettingField label="Custo da impressora (R$)" value={settings.printer_cost} onSave={(v) => handleSettingsSave('printer_cost', v)} />
            <SettingField label="Vida útil da impressora (horas)" value={settings.printer_life_hours} onSave={(v) => handleSettingsSave('printer_life_hours', v)} />
            <SettingField label="Valor da hora de trabalho (R$)" value={settings.hourly_rate} onSave={(v) => handleSettingsSave('hourly_rate', v)} />
            <SettingField label="Margem alvo por canal (0 a 1)" value={settings.margin_target} onSave={(v) => handleSettingsSave('margin_target', v)} />
          </div>
          <div className="field" style={{ marginTop: 8 }}>
            <label>Incluir embalagem no custo?</label>
            <select value={settings.include_packaging ? 'sim' : 'nao'} onChange={(e) => handleSettingsSave('include_packaging', e.target.value === 'sim')}>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </select>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Canais de venda</h3>
        <table>
          <thead><tr><th>Canal</th><th>Comissão</th><th>Taxa fixa</th></tr></thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="mono">{(Number(c.commission) * 100).toFixed(1)}%</td>
                <td className="mono">{formatBRL(c.fixed_fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettingField({ label, value, onSave }) {
  const [local, setLocal] = useState(value);
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number" step="0.0001" value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onSave(Number(local))}
      />
    </div>
  );
}
