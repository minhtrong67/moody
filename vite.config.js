import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // Tách thư viện lớn thành chunk riêng để cache lâu dài và tải song song.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
          if (/node_modules\/(recharts|d3-|victory-vendor|recharts-scale)/.test(id)) return 'charts'
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Moody — Nhật ký tâm trạng',
        short_name: 'Moody',
        description: 'Theo dõi tâm trạng mỗi ngày, xem xu hướng và xuất báo cáo',
        // Splash do hệ điều hành vẽ chỉ nhận MỘT màu nền cố định (manifest chưa hỗ trợ theo theme sáng/tối),
        // nên dùng màu thương hiệu trung tính thay vì màu nền sáng gây chói khi đang dùng giao diện tối.
        theme_color: '#009688',
        background_color: '#009688',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
