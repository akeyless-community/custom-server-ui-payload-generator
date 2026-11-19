import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/custom-server-ui-payload-generator/',
    build: {
        outDir: 'build',
    },
});
