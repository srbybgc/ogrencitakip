import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AuthGate from './AuthGate'
import StudentOverlayFixed from './StudentOverlayFixed'
import UXFixes from './UXFixes'
import './firebase'
import './styles.css'
import './pastelTheme.css'
import { repairStoredData } from './integrity'

repairStoredData()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <App />
      <StudentOverlayFixed />
      <UXFixes />
    </AuthGate>
  </React.StrictMode>,
)
