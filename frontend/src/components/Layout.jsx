import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/calculadora', label: 'Calculadora' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/configuracoes', label: 'Configurações' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="spool" />
          <span>Venda 3D</span>
        </div>

        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '0 12px 8px' }}>{user?.name}</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
