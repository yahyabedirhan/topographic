import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { docsPlugin } from './docs';

export default defineConfig({ plugins: [react(), docsPlugin()], base: './' });
