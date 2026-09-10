import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './firebase'
import './styles.css'
import { repairStoredData } from './integrity'

repairStoredData()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
