import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // We will replace styles.css with index.css
import { PlannerProvider } from './store/PlannerContext.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlannerProvider>
        <App />
      </PlannerProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
