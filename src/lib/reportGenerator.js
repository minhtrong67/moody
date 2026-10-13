import { moodByKey } from './moodConfig'
import { getReportAccent } from './theme'

// Dựng DOM báo cáo rồi chụp lại bằng html2canvas (giữ nguyên font chữ vì được render dưới dạng ảnh).
// Dùng chung cho xuất PDF và xuất ảnh PNG. `i18n` = { t, locale } từ useI18n().
async function buildReportCanvas({ periodLabel, stats, distribution, timeSeries, activityStats = [], i18n }) {
  const { t, locale } = i18n
  const accent = getReportAccent()
  const { default: html2canvas } = await import('html2canvas')

  const node = document.createElement('div')
  // QUAN TRỌNG: giữ phần tử ở toạ độ dương bình thường (0,0), KHÔNG dùng left âm,
  // transform, hay truyền x/y/scrollX/scrollY/windowWidth/windowHeight cho html2canvas —
  // mọi cách "mẹo" để dịch phần tử ra ngoài khung nhìn đều khiến thư viện này tính sai
  // vùng chụp. Cách ổn định duy nhất là để phần tử nằm đúng vị trí tự nhiên nhưng đẩy
  // xuống dưới z-index để người dùng không nhìn thấy nó trong lúc chụp.
  node.style.position = 'fixed'
  node.style.top = '0'
  node.style.left = '0'
  node.style.zIndex = '-9999'
  node.style.width = '794px' // ~A4 @ 96dpi
  node.style.boxSizing = 'border-box'
  node.style.padding = '40px'
  node.style.background = '#FFFFFF'
  node.style.color = '#191C20'
  node.style.fontFamily = "Roboto, 'Segoe UI', Arial, sans-serif"

  const maxCount = Math.max(1, ...distribution.map((d) => d.count))
  const totalCount = distribution.reduce((a, d) => a + d.count, 0) || 1
  const maxActivity = Math.max(1, ...activityStats.map((a) => a.count))
  const totalActivity = activityStats.reduce((a, d) => a + d.count, 0) || 1

  node.innerHTML = `
    <div style="border-bottom:3px solid ${accent}; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <div style="font-size:22px; font-weight:700; color:${accent};">${t('report.title')}</div>
        <div style="font-size:13px; color:#44474E; margin-top:4px;">${periodLabel}</div>
      </div>
      <div style="font-size:11px; color:#74777F;">${t('report.exportedOn', { date: new Date().toLocaleDateString(locale) })}</div>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:28px;">
      ${statCard(t('stats.avgMood'), stats.avg != null ? stats.avg.toFixed(2) + '/5' : '—')}
      ${statCard(t('report.checkinDays'), String(stats.checkinDays))}
      ${statCard(t('stats.streak'), t('report.days', { n: stats.streak }))}
      ${statCard(t('stats.topMood'), stats.topMood ? stats.topMood.emoji + ' ' + stats.topMood.label : '—')}
    </div>

    <div style="font-size:14px; font-weight:700; color:${accent}; margin-bottom:12px;">${t('report.trend')}</div>
    <div style="display:flex; align-items:flex-end; gap:4px; height:140px; border-bottom:1px solid #C4C6D0; margin-bottom:8px; padding:0 4px; width:100%; box-sizing:border-box;">
      ${timeSeries.map((p) => `
        <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
          <div style="width:100%; max-width:22px; border-radius:3px 3px 0 0; background:${p.avg ? moodColor(p.avg) : '#E2E2E9'}; height:${p.avg ? Math.max(4, (p.avg / 5) * 130) : 2}px;"></div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; gap:4px; padding:0 4px; margin-bottom:28px; width:100%; box-sizing:border-box;">
      ${timeSeries.map((p) => `<div style="flex:1 1 0; min-width:0; text-align:center; font-size:8px; color:#74777F;">${timeSeries.length > 20 ? '' : p.label}</div>`).join('')}
    </div>

    <div style="font-size:14px; font-weight:700; color:${accent}; margin-bottom:12px;">${t('stats.distribution')}</div>
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

    <div style="font-size:14px; font-weight:700; color:${accent}; margin:28px 0 12px;">${t('stats.share')}</div>
    ${pieSection(distribution, totalCount)}

    ${activityStats.length ? `
      <div style="font-size:14px; font-weight:700; color:${accent}; margin:28px 0 12px;">${t('stats.activities')}</div>
      <table style="width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;">
        <colgroup>
          <col style="width:150px;" />
          <col />
          <col style="width:80px;" />
        </colgroup>
        ${activityStats.map((a) => `
          <tr>
            <td style="padding:6px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${a.emoji} ${a.label}</td>
            <td style="padding:6px 8px;">
              <div style="background:#E2E2E9; border-radius:6px; height:14px; width:100%; overflow:hidden;">
                <div style="background:${accent}; height:100%; width:${(a.count / maxActivity) * 100}%;"></div>
              </div>
            </td>
            <td style="padding:6px 0; text-align:right; color:#44474E;">${a.count} (${Math.round((a.count / totalActivity) * 100)}%)</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}

    <div style="margin-top:36px; font-size:10px; color:#74777F; text-align:center; border-top:1px solid #C4C6D0; padding-top:12px;">
      ${t('report.footer')}
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
  return periodLabel.replace(/[\s/,]+/g, '-')
}

export async function exportStatsPdf(args) {
  // Nạp thư viện nặng khi thật sự cần (bấm xuất) để trang Thống kê mở nhanh hơn.
  const [canvas, { default: jsPDF }] = await Promise.all([buildReportCanvas(args), import('jspdf')])
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
  pdf.save(`moody-report-${fileSafeLabel(args.periodLabel)}.pdf`)
}

export async function exportStatsImage(args) {
  const canvas = await buildReportCanvas(args)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moody-report-${fileSafeLabel(args.periodLabel)}.png`
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

// Biểu đồ tròn dạng SVG nội tuyến (html2canvas vẽ SVG ổn định, không dùng conic-gradient) + chú thích bên cạnh.
function pieSection(items, total) {
  const data = items.filter((d) => d.count > 0)
  if (!data.length) return ''
  const R = 80
  const C = 90
  let angle = -Math.PI / 2
  const slices = data.map((d) => {
    const frac = d.count / total
    if (frac >= 0.9999) return `<circle cx="${C}" cy="${C}" r="${R}" fill="${d.color}" />`
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    const [x0, y0] = [C + R * Math.cos(a0), C + R * Math.sin(a0)]
    const [x1, y1] = [C + R * Math.cos(a1), C + R * Math.sin(a1)]
    return `<path d="M${C} ${C} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${d.color}" stroke="#FFFFFF" stroke-width="2" />`
  })
  const legend = data
    .map(
      (d) => `
      <div style="position:relative; padding-left:18px; font-size:12px; line-height:20px; margin:6px 0;">
        <span style="position:absolute; left:0; top:5px; width:10px; height:10px; border-radius:50%; background:${d.color};"></span>
        <span style="float:right; color:#44474E;">${d.count} (${Math.round((d.count / total) * 100)}%)</span>
        <span>${d.emoji} ${d.label}</span>
      </div>`
    )
    .join('')
  return `
    <div style="display:flex; align-items:center; gap:36px;">
      <svg width="180" height="180" viewBox="0 0 180 180" style="flex:none;">${slices.join('')}</svg>
      <div style="flex:1;">${legend}</div>
    </div>`
}
