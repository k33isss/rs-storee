import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { syncCurrency } from './lib/currency.js'

syncCurrency();

createRoot(document.getElementById('root')).render(
    <HashRouter>
    <App />
</HashRouter>,
)
