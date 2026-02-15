import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { i18nPromise } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Display a simple loading message while i18n is initializing
root.render(
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    color: '#333'
  }}>
    Loading application...
  </div>
);


// Wait for i18n to be initialized before rendering the main app
i18nPromise.then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
