import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './index.css';

// Temporarily disable StrictMode to prevent dual socket connections during development
// TODO: Re-enable StrictMode and implement proper socket connection handling
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
