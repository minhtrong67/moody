import { useEffect } from 'react'
import { checkAndFireNotifications } from '../lib/notifications'

// Kiểm tra mỗi phút xem có cần bắn thông báo nhắc check-in / báo cáo tuần / tháng không.
// Chỉ hoạt động khi app đang mở (giới hạn của Web Notification API không kèm service worker + push server).
export function useNotificationScheduler() {
  useEffect(() => {
    checkAndFireNotifications()
    const interval = setInterval(checkAndFireNotifications, 60 * 1000)
    return () => clearInterval(interval)
  }, [])
}
