/// <reference types="vite/client" />
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

const Prototype = import.meta.env.DEV ? lazy(() => import('./prototype/Prototype').then((m) => ({ default: m.Prototype }))) : null;
const params = new URLSearchParams(location.search);
const prototype = Prototype && (params.has('variant') || params.get('mode') === '3d');

createRoot(document.getElementById('root')!).render(prototype && Prototype ? <Suspense><Prototype /></Suspense> : <App />);
