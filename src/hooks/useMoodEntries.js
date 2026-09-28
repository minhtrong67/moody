// Đã chuyển thành Context (nạp một lần ở gốc app) để chuyển trang không bị
// load lại — xem src/context/MoodEntriesContext.jsx. Giữ file này để không
// phải sửa đường dẫn import ở các trang.
export { useMoodEntries } from '../context/MoodEntriesContext'
