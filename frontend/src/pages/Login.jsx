import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.inviteCode);
      }
      navigate('/calculadora');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="eyebrow">Venda 3D</div>
        <h2 style={{ marginBottom: 4 }}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
          {mode === 'login' ? 'Acesse o controle de produção e vendas.' : 'Cadastro liberado só com o código combinado.'}
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="inviteCode">Código de convite</label>
              <input id="inviteCode" value={form.inviteCode} onChange={(e) => update('inviteCode', e.target.value)} required />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={() => { setError(null); setMode(mode === 'login' ? 'register' : 'login'); }}
        >
          {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  );
}
