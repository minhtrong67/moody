import { moodByKey } from './moodConfig'

// Dựng DOM báo cáo rồi chụp lại bằng html2canvas (giữ nguyên font chữ tiếng Việt vì
// được render dưới dạng ảnh). Dùng chung cho cả xuất PDF và xuất ảnh PNG bên dưới.
async function buildReportCanvas({ periodLabel, stats, distribution, timeSeries }) {
  const { default: html2canvas } = await import('html2canvas')

  const node = document.createElement('div')
  // QUAN TRỌNG: giữ phần tử ở toạ độ dương bình thường (0,0), KHÔNG dùng left âm,
  // transform, hay truyền x/y/scrollX/scrollY/windowWidth/windowHeight cho html2canvas —
  // mọi cách "mẹo" để dịch phần tử ra ngoài khung nhìn đều khiến thư viện này tính sai
  // vùng chụp (từng gây cắt mất nội dung bên trái, rồi bên phải). Cách ổn định duy nhất
  // là để phần tử nằm đúng vị trí tự nhiên trên trang nhưng đẩy xuống dưới z-index để
  // người dùng không nhìn thấy nó trong lúc chụp.
  node.style.position = 'fixed'
  node.style.top = '0'
  node.style.left = '0'
  node.style.zIndex = '-9999'
  node.style.width = '794px' // ~A4 @ 96dpi
  node.style.boxSizing = 'border-box'
  node.style.padding = '40px'
  node.style.background = '#FFFFFF'
  node.style.color = '#191C20'
  node.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif"

  const maxCount = Math.max(1, ...distribution.map((d) => d.count))
  const totalCount = distribution.reduce((a, d) => a + d.count, 0) || 1

  node.innerHTML = `
    <div style="border-bottom:3px solid #415F91; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <div style="font-size:22px; font-weight:700; color:#415F91;">Báo cáo Moody</div>
        <div style="font-size:13px; color:#44474E; margin-top:4px;">${periodLabel}</div>
      </div>
      <div style="font-size:11px; color:#74777F;">Xuất ngày ${new Date().toLocaleDateString('vi-VN')}</div>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:28px;">
      ${statCard('Mood trung bình', stats.avg != null ? stats.avg.toFixed(2) + '/5' : '—')}
      ${statCard('Ngày check-in', String(stats.checkinDays))}
      ${statCard('Chuỗi hiện tại', stats.streak + ' ngày')}
      ${statCard('Cảm xúc phổ biến', stats.topMood ? stats.topMood.emoji + ' ' + stats.topMood.label : '—')}
    </div>

    <div style="font-size:14px; font-weight:700; color:#415F91; margin-bottom:12px;">Xu hướng mood theo thời gian</div>
    <div style="display:flex; align-items:flex-end; gap:4px; height:140px; border-bottom:1px solid #C4C6D0; margin-bottom:8px; padding:0 4px; width:100%; box-sizing:border-box;">
      ${timeSeries.map((t) => `
        <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
          <div style="width:100%; max-width:22px; border-radius:3px 3px 0 0; background:${t.avg ? moodColor(t.avg) : '#E2E2E9'}; height:${t.avg ? Math.max(4, (t.avg / 5) * 130) : 2}px;"></div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; gap:4px; padding:0 4px; margin-bottom:28px; width:100%; box-sizing:border-box;">
      ${timeSeries.map((t) => `<div style="flex:1 1 0; min-width:0; text-align:center; font-size:8px; color:#74777F;">${timeSeries.length > 20 ? '' : t.label}</div>`).join('')}
    </div>

    <div style="font-size:14px; font-weight:700; color:#415F91; margin-bottom:12px;">Phân bố cảm xúc</div>
    <table style="width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;">
      <colgroup>
        <col style="width:110px;" />
        <col />
        <col style="width:80px;" />
      </colgroup>
      ${distribution.map((d) => `
        <tr>
          <td style="padding:6px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.emoji} ${d.label}</td>
          <td style="padding:6px 8px;">
            <div style="background:#E2E2E9; border-radius:6px; height:14px; width:100%; overflow:hidden;">
              <div style="background:${d.color}; height:100%; width:${(d.count / maxCount) * 100}%;"></div>
            </div>
          </td>
          <td style="padding:6px 0; text-align:right; color:#44474E;">${d.count} (${Math.round((d.count / totalCount) * 100)}%)</td>
        </tr>
      `).join('')}
    </table>

    <div style="margin-top:36px; font-size:10px; color:#74777F; text-align:center; border-top:1px solid #C4C6D0; padding-top:12px;">
      Moody — báo cáo được tạo tự động
    </div>
  `

  document.body.appendChild(node)
  try {
    return await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF' })
  } finally {
    document.body.removeChild(node)
  }
}

function fileSafeLabel(periodLabel) {
  return periodLabel.replace(/\s|\//g, '-')
}

export async function exportStatsPdf({ periodLabel, stats, distribution, timeSeries }) {
  // Nạp thư viện nặng khi thật sự cần (bấm xuất) để trang Thống kê mở nhanh hơn.
  const [canvas, { default: jsPDF }] = await Promise.all([
    buildReportCanvas({ periodLabel, stats, distribution, timeSeries }),
    import('jspdf')
  ])
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
  pdf.save(`moody-report-${fileSafeLabel(periodLabel)}.pdf`)
}

export async function exportStatsImage({ periodLabel, stats, distribution, timeSeries }) {
  const canvas = await buildReportCanvas({ periodLabel, stats, distribution, timeSeries })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moody-report-${fileSafeLabel(periodLabel)}.png`
  a.click()
  URL.revokeObjectURL(url)
}

function statCard(label, value) {
  return `
    <div style="flex:1; border:1px solid #C4C6D0; border-radius:12px; padding:12px 14px;">
      <div style="font-size:11px; color:#44474E; margin-bottom:4px;">${label}</div>
      <div style="font-size:16px; font-weight:700; color:#191C20;">${value}</div>
    </div>
  `
}

function moodColor(avg) {
  const rounded = Math.round(avg)
  const m = moodByKey(['angry', 'sad', 'okay', 'good', 'great'][rounded - 1] || 'okay')
  return m ? m.color : '#9FB8C8'
}
