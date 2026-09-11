import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AuthGate from './AuthGate'
import StudentOverlayFixed from './StudentOverlayFixed'
import UXFixes from './UXFixes'
import AppErrorBoundary from './AppErrorBoundary'
import './firebase'
import './styles.css'
import './pastelTheme.css'
import { repairStoredData } from './integrity'

try {
  repairStoredData()
} catch (error) {
  console.error('Yerel veri onarımı atlandı:', error)
}

const root = document.getElementById('root')

if (!root) throw new Error('Uygulama kökü (#root) bulunamadı.')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthGate>
        <App />
        <StudentOverlayFixed />
        <UXFixes />
      </AuthGate>
    </AppErrorBoundary>
  </React.StrictMode>,
)
