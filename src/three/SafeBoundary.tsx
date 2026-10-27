import { Component, type ReactNode } from 'react'

// Contiene los errores del 3D (un modelo que no carga, un shader que no compila)
// para que no desmonten toda la página. Sin esto, un fallo deja la pantalla en negro.
export default class SafeBoundary extends Component<
  { fallback?: ReactNode; onError?: (e: unknown) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e: unknown) {
    console.error('[3D]', e)
    this.props.onError?.(e)
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
