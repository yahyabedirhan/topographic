/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { TerrainBoundary } from './boundary';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <TerrainBoundary>
    <App />
  </TerrainBoundary>,
);
