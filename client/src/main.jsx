import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Leaflet's base stylesheet first so `index.css` overrides win.
import 'leaflet/dist/leaflet.css';
import './index.css';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MetaProvider } from './context/MetaContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MetaProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </MetaProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
