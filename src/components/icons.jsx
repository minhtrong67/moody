// Bộ icon Material (react-icons/md). Giữ nguyên tên export như lucide-react cũ để các trang
// không phải đổi API; `strokeWidth` bị bỏ qua vì icon Material là dạng fill.
import {
  MdOutlineHome, MdHome, MdOutlineChecklist, MdOutlineBarChart, MdOutlineSettings,
  MdAdd, MdArrowUpward, MdArrowDownward, MdArrowBack, MdArrowForward, MdMenu,
  MdLightMode, MdDarkMode, MdSettingsBrightness, MdClose, MdCheck, MdWarningAmber,
  MdHelpOutline, MdNotificationsNone, MdDateRange, MdShowChart, MdCalendarMonth,
  MdEventAvailable, MdExpandMore, MdChevronLeft, MdChevronRight, MdSchedule,
  MdFileDownload, MdPictureAsPdf, MdImage, MdLocalFireDepartment, MdFavoriteBorder,
  MdFormatListBulleted, MdPlaylistAdd, MdLogout, MdEditNote, MdEdit, MdRestartAlt,
  MdSearch, MdSend, MdTune, MdSmartphone, MdOutlineSentimentSatisfied,
  MdDeleteOutline, MdTrendingUp, MdDragIndicator, MdOutlineHistory, MdHistory,
  MdOutlineBarChart as MdBarChartOutline, MdBarChart
} from 'react-icons/md'

function wrap(Icon) {
  // eslint-disable-next-line no-unused-vars
  return function MaterialIcon({ strokeWidth, ...props }) {
    return <Icon aria-hidden="true" {...props} />
  }
}

export const Home = wrap(MdOutlineHome)
export const HomeFilled = wrap(MdHome)
export const ListChecks = wrap(MdOutlineChecklist)
export const HistoryIcon = wrap(MdOutlineHistory)
export const HistoryFilled = wrap(MdHistory)
export const BarChart3 = wrap(MdBarChartOutline)
export const BarChartFilled = wrap(MdBarChart)
export const Settings = wrap(MdOutlineSettings)
export const Plus = wrap(MdAdd)
export const ArrowUp = wrap(MdArrowUpward)
export const ArrowDown = wrap(MdArrowDownward)
export const ArrowLeft = wrap(MdArrowBack)
export const ArrowRight = wrap(MdArrowForward)
export const Menu = wrap(MdMenu)
export const Sun = wrap(MdLightMode)
export const Moon = wrap(MdDarkMode)
export const Monitor = wrap(MdSettingsBrightness)
export const X = wrap(MdClose)
export const Check = wrap(MdCheck)
export const AlertTriangle = wrap(MdWarningAmber)
export const HelpCircle = wrap(MdHelpOutline)
export const Bell = wrap(MdNotificationsNone)
export const CalendarRange = wrap(MdDateRange)
export const LineChart = wrap(MdShowChart)
export const Calendar = wrap(MdCalendarMonth)
export const CalendarCheck2 = wrap(MdEventAvailable)
export const ChevronDown = wrap(MdExpandMore)
export const ChevronLeft = wrap(MdChevronLeft)
export const ChevronRight = wrap(MdChevronRight)
export const Clock3 = wrap(MdSchedule)
export const Download = wrap(MdFileDownload)
export const FileDown = wrap(MdPictureAsPdf)
export const Image = wrap(MdImage)
export const Flame = wrap(MdLocalFireDepartment)
export const Heart = wrap(MdFavoriteBorder)
export const List = wrap(MdFormatListBulleted)
export const ListPlus = wrap(MdPlaylistAdd)
export const LogOut = wrap(MdLogout)
export const NotebookPen = wrap(MdEditNote)
export const Pencil = wrap(MdEdit)
export const RotateCcw = wrap(MdRestartAlt)
export const Search = wrap(MdSearch)
export const Send = wrap(MdSend)
export const Settings2 = wrap(MdTune)
export const SlidersHorizontal = wrap(MdTune)
export const Smartphone = wrap(MdSmartphone)
export const Smile = wrap(MdOutlineSentimentSatisfied)
export const Trash2 = wrap(MdDeleteOutline)
export const TrendingUp = wrap(MdTrendingUp)
export const GripVertical = wrap(MdDragIndicator)

// Vòng tròn tiến trình kiểu Material (indeterminate), thay cho Loader2.
export function Loader2({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`m3-spinner ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
