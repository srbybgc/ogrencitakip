import React from 'react'

export default class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Öğrenci Takip çalışma zamanı hatası:', error, info)
  }

  reload = () => window.location.reload()

  clearLocalData = () => {
    const keys = ['ot-classes', 'ot-groups', 'ot-schedule', 'ot-documents', 'ot-student-records', 'ot-trash']
    keys.forEach(key => localStorage.removeItem(key))
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || String(this.state.error)
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="brand-mark auth-mark">Ö</div>
          <p className="eyebrow">Uygulama hatası</p>
          <h1>Öğrenci Takip açılamadı</h1>
          <p className="muted">Uygulama çalışırken beklenmeyen bir hata oluştu. Önce yeniden yüklemeyi deneyin.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 180, overflow: 'auto', fontSize: 12, margin: '16px 0' }}>{message}</pre>
          <button className="primary auth-submit" onClick={this.reload}>Yeniden Yükle</button>
          <button className="auth-switch" onClick={this.clearLocalData}>Yerel verileri temizle ve aç</button>
        </section>
      </main>
    )
  }
}
