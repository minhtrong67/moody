// Nhắc nhở check-in / báo cáo — hoạt động khi app đang mở trong trình duyệt
// (Web Notification API không hỗ trợ hẹn giờ chạy nền thật sự nếu không có
// service worker + push server riêng). Hook useNotificationScheduler sẽ kiểm
// tra định kỳ mỗi phút khi app đang chạy và bắn thông báo đúng thời điểm.

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

function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch {
    // một số trình duyệt mobile yêu cầu dùng ServiceWorkerRegistration.showNotification thay vì `new Notification`
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

// Gọi định kỳ (mỗi phút) từ useNotificationScheduler.
export function checkAndFireNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const settings = getNotificationSettings()
  const now = new Date()
  const todayIso = now.toISOString().slice(0, 10)
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (settings.dailyEnabled && hhmm === settings.dailyTime && localStorage.getItem(KEYS.lastDaily) !== todayIso) {
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
