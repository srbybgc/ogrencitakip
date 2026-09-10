import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AuthGate from './AuthGate'
import StudentOverlay from './StudentOverlay'
import LifecycleOverlay from './LifecycleOverlay'
import './firebase'
import './styles.css'
import { repairStoredData } from './integrity'

repairStoredData()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <App />
      <StudentOverlay />
      <LifecycleOverlay />
    </AuthGate>
  </React.StrictMode>,
)
