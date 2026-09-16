import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <h2 className="display-lg">Something went wrong</h2>
          <p className="body-md" style={{ marginTop: 12 }}>
            The page failed to render. You can reload, or return to the dashboard.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <button className="btn" onClick={() => window.location.reload()}>Reload</button>
            <button className="btn outline" onClick={() => { window.location.href = '/' }}>Go to dashboard</button>
          </div>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: 20, fontSize: 12, textAlign: 'left', overflow: 'auto' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
