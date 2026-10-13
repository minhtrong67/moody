// Định nghĩa 5 mức tâm trạng dùng xuyên suốt app. Nhãn mặc định lấy từ i18n (mood.<key>),
// nhãn/emoji người dùng tự đổi được lưu riêng (xem MoodsContext).
export const MOODS = [
  { key: 'great',  emoji: '😄', score: 5, color: '#F0A34E' },
  { key: 'good',   emoji: '🙂', score: 4, color: '#8FBF7F' },
  { key: 'okay',   emoji: '😐', score: 3, color: '#9FB8C8' },
  { key: 'sad',    emoji: '😔', score: 2, color: '#7D8CB0' },
  { key: 'angry',  emoji: '😠', score: 1, color: '#C4676B' }
]

// Hoạt động mặc định (emoji). Nhãn mặc định lấy từ i18n (activity.<id>).
// Người dùng có thể thêm hoạt động tùy chỉnh (xem useActivities).
export const DEFAULT_ACTIVITIES = [
  { id: 'sleep', emoji: '😴' },
  { id: 'work', emoji: '💼' },
  { id: 'study', emoji: '📚' },
  { id: 'health', emoji: '🩺' },
  { id: 'social', emoji: '👥' },
  { id: 'family', emoji: '👨‍👩‍👧' },
  { id: 'weather', emoji: '🌤️' },
  { id: 'money', emoji: '💰' },
  { id: 'exercise', emoji: '🏃' },
  { id: 'food', emoji: '🍜' }
]

export function moodByKey(key) {
  return MOODS.find((m) => m.key === key)
}

export function moodByScore(score) {
  return MOODS.find((m) => m.score === score)
}
