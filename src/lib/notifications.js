// Nhắc nhở check-in / báo cáo — chỉ hoạt động khi app đang mở (tab hoặc PWA).
// Không có service worker đẩy nền (push server) nên không thể bắn thông báo
// khi app đã bị đóng hẳn — xem ghi chú ở cuối file.

import { toLocalISODate } from './dateUtils'

const KEYS = {
  dailyEnabled: 'notif-daily-enabled',
  dailyTime: 'notif-daily-time', // "HH:MM"
  weeklyEnabled: 'notif-weekly-enabled',
  monthlyEnabled: 'notif-monthly-enabled',
  lastDaily: 'notif-last-daily', // "YYYY-MM-DD"
  lastWeekly: 'notif-last-weekly', // "YYYY-Www"
  lastMonthly: 'notif-last-monthly' // "YYYY-MM"
}

export function getNotificationSettings() {
  return {
    dailyEnabled: localStorage.getItem(KEYS.dailyEnabled) === '1',
    dailyTime: localStorage.getItem(KEYS.dailyTime) || '20:00',
    weeklyEnabled: localStorage.getItem(KEYS.weeklyEnabled) === '1',
    monthlyEnabled: localStorage.getItem(KEYS.monthlyEnabled) === '1'
  }
}

export function setNotificationSetting(key, value) {
  localStorage.setItem(KEYS[key], value)
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

// Nhiều trình duyệt di động (Android Chrome ở chế độ PWA, iOS Safari...) không hỗ trợ
// `new Notification()` gọi trực tiếp từ trang — chỉ nhận thông báo bắn qua Service Worker
// (registration.showNotification). Ưu tiên đường này, chỉ dùng `new Notification()` làm
// phương án dự phòng cho trình duyệt desktop không có service worker.
async function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: title
        })
        return
      }
    } catch {
      // rơi xuống phương án dự phòng bên dưới
    }
  }

  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch {
    // trình duyệt này chỉ hỗ trợ thông báo qua service worker — không còn cách nào khác
  }
}

function isoWeek(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const weekNo = 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${date.getFullYear()}-W${weekNo}`
}

// Gọi định kỳ (mỗi phút, và mỗi khi app được mở lại) từ useNotificationScheduler.
// Dùng điều kiện "đã TỚI HOẶC QUA giờ hẹn, và chưa bắn trong ngày/tuần/tháng này" thay vì
// khớp đúng từng phút — vì trình duyệt di động thường tạm dừng bộ đếm giờ khi app chạy nền
// hoặc màn hình khoá, nên không thể đảm bảo code chạy đúng vào phút cần bắn thông báo.
export function checkAndFireNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const settings = getNotificationSettings()
  const now = new Date()
  const todayIso = toLocalISODate(now)
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (settings.dailyEnabled && hhmm >= settings.dailyTime && localStorage.getItem(KEYS.lastDaily) !== todayIso) {
    notify('Đến giờ check-in rồi! 🌤️', 'Dành 10 giây ghi lại tâm trạng hôm nay của bạn trên Moody.')
    localStorage.setItem(KEYS.lastDaily, todayIso)
  }

  const isMonday = now.getDay() === 1
  if (settings.weeklyEnabled && isMonday && hhmm >= '09:00' && localStorage.getItem(KEYS.lastWeekly) !== isoWeek(now)) {
    notify('Báo cáo tuần trước đã sẵn sàng 📊', 'Xem lại xu hướng tâm trạng tuần vừa qua trong mục Thống kê.')
    localStorage.setItem(KEYS.lastWeekly, isoWeek(now))
  }

  const isFirstOfMonth = now.getDate() === 1
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`
  if (settings.monthlyEnabled && isFirstOfMonth && hhmm >= '09:00' && localStorage.getItem(KEYS.lastMonthly) !== monthKey) {
    notify('Báo cáo tháng trước đã sẵn sàng 🗓️', 'Xem thống kê mood cả tháng vừa qua và xuất báo cáo PDF nếu cần.')
    localStorage.setItem(KEYS.lastMonthly, monthKey)
  }
}

// Gửi thử một thông báo ngay lập tức — dùng để người dùng tự kiểm tra quyền/thiết bị
// có nhận được thông báo thật sự hay không, thay vì phải chờ đến đúng giờ hẹn.
export async function sendTestNotification() {
  await notify('Thông báo thử từ Moody 👋', 'Nếu bạn thấy thông báo này, mọi thứ đang hoạt động tốt.')
}
