import { useEffect } from 'react'
import { checkAndFireNotifications } from '../lib/notifications'

// Kiểm tra mỗi phút, VÀ mỗi khi app được mở lại (quay lại tab / mở khoá màn hình) xem có
// cần bắn thông báo nhắc check-in / báo cáo tuần / tháng không. Kiểm tra thêm lúc quay lại
// giúp bắt kịp các mốc giờ bị bỏ lỡ khi trình duyệt tạm dừng bộ đếm giờ lúc app chạy nền.
export function useNotificationScheduler() {
  useEffect(() => {
    checkAndFireNotifications()
    const interval = setInterval(checkAndFireNotifications, 60 * 1000)

    function onVisible() {
      if (document.visibilityState === 'visible') checkAndFireNotifications()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])
}
