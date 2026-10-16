// Bảng màu phân loại 8 ô cố định (sáng / tối) cho biểu đồ tròn hoạt động.
// Gán theo thứ tự cố định, không xoay vòng; mục thứ 9 trở đi gộp vào "Khác".
const LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
const DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

export const CATEGORY_COLORS = (isDark) => (isDark ? DARK : LIGHT)
export const OTHER_COLOR = '#9a9a96'
export const REPORT_CATEGORY_COLORS = LIGHT // báo cáo luôn nền trắng
