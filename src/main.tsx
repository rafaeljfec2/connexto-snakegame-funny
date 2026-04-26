import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { SkinProvider } from './contexts/SkinContext';
import { bootstrapPerfObservability } from './utils/perfBootstrap';
import './index.css';
import { i18nReady } from './i18n/config';

bootstrapPerfObservability();

void i18nReady.finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <SkinProvider>
          <App />
        </SkinProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
});
