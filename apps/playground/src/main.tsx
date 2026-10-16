/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installDebug } from './debug';
import './style.css';

installDebug();
createRoot(document.getElementById('root')!).render(<App />);
