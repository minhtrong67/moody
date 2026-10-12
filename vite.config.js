import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
        theme_color: '#415F91',
        background_color: '#415F91',
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
