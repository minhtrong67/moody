import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { moodByKey } from './moodConfig'

// Dựng một node HTML ẩn chứa nội dung báo cáo, chụp lại bằng html2canvas (giữ nguyên
// font chữ tiếng Việt vì được render dưới dạng ảnh) rồi nhúng vào PDF qua jsPDF.
export async function exportStatsPdf({ periodLabel, stats, distribution, timeSeries }) {
  const node = document.createElement('div')
  node.style.position = 'fixed'
  node.style.left = '-9999px'
  node.style.top = '0'
  node.style.width = '794px' // ~A4 @ 96dpi
  node.style.padding = '40px'
  node.style.background = '#FFFFFF'
  node.style.color = '#23231F'
  node.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif"

  const maxAvg = Math.max(1, ...timeSeries.map((t) => t.avg || 0))
  const maxCount = Math.max(1, ...distribution.map((d) => d.count))
  const totalCount = distribution.reduce((a, d) => a + d.count, 0) || 1

  node.innerHTML = `
    <div style="border-bottom:3px solid #0F766E; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <div style="font-size:22px; font-weight:700; color:#0F766E;">Báo cáo Moody</div>
        <div style="font-size:13px; color:#6B6A63; margin-top:4px;">${periodLabel}</div>
      </div>
      <div style="font-size:11px; color:#9a9992;">Xuất ngày ${new Date().toLocaleDateString('vi-VN')}</div>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:28px;">
      ${statCard('Mood trung bình', stats.avg != null ? stats.avg.toFixed(2) + '/5' : '—')}
      ${statCard('Ngày check-in', String(stats.checkinDays))}
      ${statCard('Chuỗi hiện tại', stats.streak + ' ngày')}
      ${statCard('Cảm xúc phổ biến', stats.topMood ? stats.topMood.emoji + ' ' + stats.topMood.label : '—')}
    </div>

    <div style="font-size:14px; font-weight:700; color:#0F766E; margin-bottom:12px;">Xu hướng mood theo thời gian</div>
    <div style="display:flex; align-items:flex-end; gap:4px; height:140px; border-bottom:1px solid #DEDCD2; margin-bottom:8px; padding:0 4px;">
      ${timeSeries.map((t) => `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
          <div style="width:100%; max-width:22px; border-radius:3px 3px 0 0; background:${t.avg ? moodColor(t.avg) : '#EDEBE3'}; height:${t.avg ? Math.max(4, (t.avg / 5) * 130) : 2}px;"></div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; gap:4px; padding:0 4px; margin-bottom:28px;">
      ${timeSeries.map((t) => `<div style="flex:1; text-align:center; font-size:8px; color:#9a9992;">${timeSeries.length > 20 ? '' : t.label}</div>`).join('')}
    </div>

    <div style="font-size:14px; font-weight:700; color:#0F766E; margin-bottom:12px;">Phân bố cảm xúc</div>
    <table style="width:100%; border-collapse:collapse; font-size:12px;">
      ${distribution.map((d) => `
        <tr>
          <td style="width:110px; padding:6px 0;">${d.emoji} ${d.label}</td>
          <td style="padding:6px 8px;">
            <div style="background:#EDEBE3; border-radius:6px; height:14px; width:100%; overflow:hidden;">
              <div style="background:${d.color}; height:100%; width:${(d.count / maxCount) * 100}%;"></div>
            </div>
          </td>
          <td style="width:80px; padding:6px 0; text-align:right; color:#6B6A63;">${d.count} (${Math.round((d.count / totalCount) * 100)}%)</td>
        </tr>
      `).join('')}
    </table>

    <div style="margin-top:36px; font-size:10px; color:#9a9992; text-align:center; border-top:1px solid #DEDCD2; padding-top:12px;">
      Moody — báo cáo được tạo tự động
    </div>
  `

  document.body.appendChild(node)
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`moody-report-${periodLabel.replace(/\s|\//g, '-')}.pdf`)
  } finally {
    document.body.removeChild(node)
  }
}

function statCard(label, value) {
  return `
    <div style="flex:1; border:1px solid #DEDCD2; border-radius:12px; padding:12px 14px;">
      <div style="font-size:11px; color:#6B6A63; margin-bottom:4px;">${label}</div>
      <div style="font-size:16px; font-weight:700; color:#23231F;">${value}</div>
    </div>
  `
}

function moodColor(avg) {
  const rounded = Math.round(avg)
  const m = moodByKey(['angry', 'sad', 'okay', 'good', 'great'][rounded - 1] || 'okay')
  return m ? m.color : '#9FB8C8'
}
