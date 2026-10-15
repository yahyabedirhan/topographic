/// <reference types="vite/client" />
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

const Prototype = import.meta.env.DEV ? lazy(() => import('./prototype/Prototype').then((m) => ({ default: m.Prototype }))) : null;
const prototype = Prototype && new URLSearchParams(location.search).has('variant');

createRoot(document.getElementById('root')!).render(prototype && Prototype ? <Suspense><Prototype /></Suspense> : <App />);
