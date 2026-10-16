import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthProvider';
import { CartProvider } from './contexts/CartProvider';
import { WalletProvider } from './contexts/WalletProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
);
