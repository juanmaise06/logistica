import { IcoWarn } from './Icons'

export function Spinner({ big }) {
  return <span className={`spinner${big ? ' big' : ''}`} />
}

export function CargandoPantalla({ texto = 'Cargando…' }) {
  return (
    <div className="center-screen">
      <Spinner big />
      <p className="muted">{texto}</p>
    </div>
  )
}

export function Alerta({ tipo = 'info', children, onClose }) {
  if (!children) return null
  return (
    <div className={`alert ${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <div className="flex-between">
        <span>{children}</span>
        {onClose && <button className="iconbtn" style={{ width: 24, height: 24 }} onClick={onClose}>✕</button>}
      </div>
    </div>
  )
}

export function Vacio({ icono, titulo, children }) {
  return (
    <div className="empty">
      {icono || <IcoWarn />}
      <h3 style={{ margin: '6px 0', color: 'var(--text-dim)' }}>{titulo}</h3>
      {children && <p style={{ fontSize: '0.88rem' }}>{children}</p>}
    </div>
  )
}

export function Modal({ titulo, children, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {titulo && <h3>{titulo}</h3>}
        {children}
      </div>
    </div>
  )
}

export function Confirmar({ titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Eliminar' }) {
  return (
    <Modal titulo={titulo} onClose={onCancelar}>
      <p className="muted" style={{ marginTop: 0 }}>{mensaje}</p>
      <div className="btn-row mt">
        <button className="btn secundario" onClick={onCancelar}>Cancelar</button>
        <button className="btn peligro" onClick={onConfirmar}>{textoConfirmar}</button>
      </div>
    </Modal>
  )
}
