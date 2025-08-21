import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const isProduction = mode === 'production'

    return {
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
                },
                manifest: {
                    name: 'Lumière - Video Lecture Organizer',
                    short_name: 'Lumière',
                    description: 'Premium video lecture organization and tracking application',
                    theme_color: '#3b82f6',
                    background_color: '#ffffff',
                    display: 'standalone',
                    orientation: 'portrait',
                    scope: '/',
                    start_url: '/',
                    icons: [
                        {
                            src: '/lumiere-logo.svg',
                            sizes: 'any',
                            type: 'image/svg+xml'
                        }
                    ]
                }
            })
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@components': resolve(__dirname, 'src/components'),
                '@contexts': resolve(__dirname, 'src/contexts'),
                '@pages': resolve(__dirname, 'src/pages'),
                '@utils': resolve(__dirname, 'src/utils'),
                '@config': resolve(__dirname, 'src/config')
            }
        },
        build: {
            outDir: 'dist',
            sourcemap: !isProduction,
            minify: isProduction ? 'terser' : false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
                        router: ['react-router-dom'],
                        ui: ['framer-motion', 'lucide-react', 'recharts'],
                        utils: ['date-fns', 'clsx']
                    }
                }
            },
            chunkSizeWarningLimit: 1000,
            target: 'es2015'
        },
        server: {
            host: true,
            port: 3000,
            open: true
        },
        preview: {
            port: 4173,
            open: true
        },
        define: {
            __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
            __BUILD_TIME__: JSON.stringify(new Date().toISOString())
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-router-dom']
        }
    }
}) 