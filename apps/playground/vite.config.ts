import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { docsPlugin } from './docs';

export default defineConfig({ plugins: [react(), docsPlugin()], // GitHub Pages serves the site under /topography/; set BASE_PATH=/topography/ there. Relative paths work everywhere else.
  base: process.env.BASE_PATH || './' });
