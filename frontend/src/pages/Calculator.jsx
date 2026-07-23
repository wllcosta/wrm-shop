import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatBRL, formatPct, filamentColor } from '../utils/format';

const emptyForm = { name: '', grams: '', hours: '', minutes: '', manualHours: '0', filamentTypeId: '' };

export default function Calculator() {
  const { token } = useAuth();
  const [filaments, setFilaments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getFilamentTypes(token)
      .then((list) => {
        setFilaments(list);
        if (list.length > 0) setForm((f) => ({ ...f, filamentTypeId: list[0].id }));
      })
      .catch((err) => setError(err.message));
  }, [token]);

  function update(field, value) {
    setSaved(false);
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCalc(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const data = await api.calcProduct(token, {
        grams: Number(form.grams),
        hours: Number(form.hours) || 0,
        minutes: Number(form.minutes) || 0,
        manualHours: Number(form.manualHours) || 0,
        filamentTypeId: form.filamentTypeId,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Dá um nome pro produto antes de salvar.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createProduct(token, {
        name: form.name.trim(),
        grams: Number(form.grams),
        hours: Number(form.hours) || 0,
        minutes: Number(form.minutes) || 0,
        manualHours: Number(form.manualHours) || 0,
        filamentTypeId: form.filamentTypeId,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedFilament = filaments.find((f) => f.id === form.filamentTypeId);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Calculadora</div>
          <h1>Custo e precificação</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Dados da peça</h3>
          <form onSubmit={handleCalc}>
            <div className="field">
              <label>Nome do produto (opcional pra calcular, obrigatório pra salvar)</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Suporte de celular" />
            </div>

            <div className="field">
              <label>Tipo de filamento</label>
              <select value={form.filamentTypeId} onChange={(e) => update('filamentTypeId', e.target.value)} required>
                {filaments.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {formatBRL(f.price_per_kg)}/kg</option>
                ))}
              </select>
              {selectedFilament && (
                <span className="fil-chip" style={{ marginTop: 4 }}>
                  <span className="fil-dot" style={{ background: filamentColor(selectedFilament.name) }} />
                  {selectedFilament.name} selecionado
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Peso (gramas)</label>
                <input type="number" min="0" step="0.1" value={form.grams} onChange={(e) => update('grams', e.target.value)} required />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Horas de impressão</label>
                <input type="number" min="0" step="1" value={form.hours} onChange={(e) => update('hours', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Minutos</label>
                <input type="number" min="0" max="59" step="1" value={form.minutes} onChange={(e) => update('minutes', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Horas de trabalho manual (montagem, acabamento...)</label>
              <input type="number" min="0" step="0.1" value={form.manualHours} onChange={(e) => update('manualHours', e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Calculando...' : 'Calcular custo'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Resultado</h3>
          {!result && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Preencha os dados e clique em calcular.</p>}

          {result && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div className="eyebrow">Custo total ({result.costMode === 'com_fixo' ? 'com custos fixos' : 'sem custos fixos'})</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 600 }}>{formatBRL(result.activeCost)}</div>
              </div>

              <CostBreakdown result={result} />

              <h4 style={{ margin: '20px 0 10px' }}>Faixas de preço sugeridas</h4>
              <table>
                <thead><tr><th>Faixa</th><th>Preço</th><th>Margem</th></tr></thead>
                <tbody>
                  {result.tiers.map((t) => (
                    <tr key={t.label}>
                      <td>{t.label}</td>
                      <td className="mono">{formatBRL(t.price)}</td>
                      <td className="mono">{formatPct(t.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ margin: '20px 0 10px' }}>Preço sugerido por canal (margem alvo)</h4>
              <table>
                <thead><tr><th>Canal</th><th>Preço</th><th>Lucro</th></tr></thead>
                <tbody>
                  {result.channelPrices.map((c) => (
                    <tr key={c.channel.id}>
                      <td>{c.channel.name}</td>
                      <td className="mono">{formatBRL(c.price)}</td>
                      <td className="mono">{formatBRL(c.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : saved ? '✓ Produto salvo' : 'Salvar como produto'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CostBreakdown({ result }) {
  const rows = [
    ['Material (filamento)', result.material],
    ['Energia', result.energy],
    ['Depreciação da impressora', result.depreciation],
    ['Manutenção', result.maintenance],
    ['Mão de obra', result.labor],
    ['Taxa de falha', result.failure],
  ];
  return (
    <table>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ color: 'var(--text-dim)' }}>{label}</td>
            <td className="mono" style={{ textAlign: 'right' }}>{formatBRL(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
