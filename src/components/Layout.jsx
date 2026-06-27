import { NavLink } from 'react-router-dom'
import {
  IcoCompare, IcoHistory, IcoDash, IcoCar, IcoFuel, IcoPin, IcoUser, IcoTruck
} from './Icons'

const items = [
  { to: '/', icon: IcoCompare, label: 'Comparar', end: true },
  { to: '/historial', icon: IcoHistory, label: 'Historial' },
  { to: '/dashboard', icon: IcoDash, label: 'Panel' },
  { to: '/vehiculos', icon: IcoCar, label: 'Vehículos' },
  { to: '/combustibles', icon: IcoFuel, label: 'Combust.' },
  { to: '/lugares', icon: IcoPin, label: 'Lugares' },
  { to: '/perfil', icon: IcoUser, label: 'Perfil' }
]

export default function Layout({ children, online }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <IcoTruck style={{ color: 'var(--primary)' }} />
          <h1>Logística</h1>
        </div>
        <span className="chip" style={{ fontSize: '0.72rem' }}>
          {online ? '🟢 En línea' : '🔴 Sin conexión'}
        </span>
      </header>

      {!online && (
        <div className="offline-bar">
          Sin conexión: la búsqueda de direcciones y el mapa necesitan internet.
        </div>
      )}

      <nav className="bottom-nav">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icon />
              <span>{it.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  )
}
