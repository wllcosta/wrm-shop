import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatBRL, filamentColor } from '../utils/format';

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.getProducts(token)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleDelete(id) {
    if (!confirm('Remover este produto?')) return;
    try {
      await api.deleteProduct(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Estoque</div>
          <h1>Produtos cadastrados</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading && <p style={{ color: 'var(--text-dim)' }}>Carregando...</p>}
        {!loading && products.length === 0 && (
          <p style={{ color: 'var(--text-dim)' }}>Nenhum produto salvo ainda. Use a Calculadora pra criar o primeiro.</p>
        )}
        {!loading && products.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Filamento</th>
                <th>Peso</th>
                <th>Custo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.code}</td>
                  <td>{p.name}</td>
                  <td>
                    <span className="fil-chip">
                      <span className="fil-dot" style={{ background: filamentColor(p.filament_name) }} />
                      {p.filament_name}
                    </span>
                  </td>
                  <td className="mono">{p.grams}g</td>
                  <td className="mono">{formatBRL(p.cost_total)}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => handleDelete(p.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
