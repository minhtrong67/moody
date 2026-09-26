// Định nghĩa 5 mức tâm trạng dùng xuyên suốt app: check-in, lịch sử, thống kê, calendar.
export const MOODS = [
  { key: 'great',  label: 'Rất vui',   emoji: '😄', score: 5, color: '#F0A34E' },
  { key: 'good',   label: 'Vui',       emoji: '🙂', score: 4, color: '#8FBF7F' },
  { key: 'okay',   label: 'Bình thường', emoji: '😐', score: 3, color: '#9FB8C8' },
  { key: 'sad',    label: 'Buồn',      emoji: '😔', score: 2, color: '#7D8CB0' },
  { key: 'angry',  label: 'Tức giận',  emoji: '😠', score: 1, color: '#C4676B' }
]

// Hoạt động mặc định — hiển thị dạng icon (emoji) + tên trong bước check-in.
// Người dùng có thể thêm hoạt động tùy chỉnh (xem useActivities).
export const DEFAULT_ACTIVITIES = [
  { id: 'sleep', emoji: '😴', label: 'Giấc ngủ' },
  { id: 'work', emoji: '💼', label: 'Công việc' },
  { id: 'study', emoji: '📚', label: 'Học tập' },
  { id: 'health', emoji: '🩺', label: 'Sức khỏe' },
  { id: 'social', emoji: '👥', label: 'Bạn bè' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Gia đình' },
  { id: 'weather', emoji: '🌤️', label: 'Thời tiết' },
  { id: 'money', emoji: '💰', label: 'Tài chính' },
  { id: 'exercise', emoji: '🏃', label: 'Vận động' },
  { id: 'food', emoji: '🍜', label: 'Ăn uống' }
]

export function moodByKey(key) {
  return MOODS.find((m) => m.key === key)
}

export function moodByScore(score) {
  return MOODS.find((m) => m.score === score)
}
