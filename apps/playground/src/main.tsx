/// <reference types="vite/client" />
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

const Prototype = lazy(() => import('./prototype/Prototype').then((m) => ({ default: m.Prototype })));
const prototype = import.meta.env.DEV && new URLSearchParams(location.search).has('variant');

createRoot(document.getElementById('root')!).render(prototype ? <Suspense><Prototype /></Suspense> : <App />);
