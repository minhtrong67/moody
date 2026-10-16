import { moodByKey } from './moodConfig'
import { getReportAccent } from './theme'

// Dựng DOM báo cáo rồi chụp lại bằng html2canvas (giữ nguyên font chữ vì được render dưới dạng ảnh).
// Dùng chung cho xuất PDF và xuất ảnh PNG. `i18n` = { t, locale } từ useI18n().
// Báo cáo chứa đủ mọi số liệu và biểu đồ của trang Thống kê:
// 4 chỉ số, xu hướng theo thời gian, phân bố cảm xúc, tỷ lệ cảm xúc (tròn), hoạt động nổi bật, tỷ lệ hoạt động (tròn).
const PAGE_W = 794 // ~A4 @ 96dpi
const PAGE_H = 1123
const PAGE_MARGIN_Y = 32

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

async function buildReport({ periodLabel, stats, distribution, timeSeries, activityStats = [], activityPie = [], i18n }) {
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
  node.style.width = `${PAGE_W}px`
  node.style.boxSizing = 'border-box'
  node.style.padding = '0 40px'
  node.style.background = '#FFFFFF'
  node.style.color = '#191C20'
  node.style.fontFamily = "Roboto, 'Segoe UI', Arial, sans-serif"

  const totalCount = distribution.reduce((a, d) => a + d.count, 0) || 1
  const h = (text) => `<div style="font-size:14px; font-weight:700; color:${accent}; margin-bottom:12px;">${esc(text)}</div>`
  const block = (inner, mb = 28) => `<div data-blk style="margin-bottom:${mb}px;">${inner}</div>`

  const activityBars = activityStats.map((a) => ({ ...a, color: activityPie.find((p) => p.id === a.id)?.color || accent }))

  node.innerHTML =
    block(
      `<div style="border-bottom:3px solid ${accent}; padding-bottom:16px; padding-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-size:22px; font-weight:700; color:${accent};">${esc(t('report.title'))}</div>
          <div style="font-size:13px; color:#44474E; margin-top:4px;">${esc(periodLabel)}</div>
        </div>
        <div style="font-size:11px; color:#74777F;">${esc(t('report.exportedOn', { date: new Date().toLocaleDateString(locale) }))}</div>
      </div>`,
      24
    ) +
    block(
      `<div style="display:flex; gap:12px;">
        ${statCard(t('stats.avgMood'), stats.avg != null ? stats.avg.toFixed(2) + '/5' : '—')}
        ${statCard(t('report.checkinDays'), String(stats.checkinDays))}
        ${statCard(t('stats.streak'), t('report.days', { n: stats.streak }))}
        ${statCard(t('stats.topMood'), stats.topMood ? stats.topMood.emoji + ' ' + stats.topMood.label : '—')}
      </div>`
    ) +
    block(`${h(`${t('report.trend')} (${periodLabel})`)}${trendChart(timeSeries, accent)}`) +
    block(`${h(t('stats.distribution'))}${columnChart(distribution, { max: 5 })}${legendList(distribution, totalCount)}`) +
    block(`${h(t('stats.share'))}${pieSection(distribution, totalCount)}`) +
    (activityStats.length
      ? block(
          `${h(`${t('stats.activities')} (${periodLabel})`)}${columnChart(activityBars, { max: 5 })}${legendList(
            activityBars,
            activityStats.reduce((a, d) => a + d.count, 0) || 1
          )}`
        )
      : '') +
    (activityPie.length
      ? block(`${h(`${t('stats.activitiesShare')} (${periodLabel})`)}${pieSection(activityPie, activityPie.reduce((a, d) => a + d.count, 0) || 1)}`)
      : '') +
    block(
      `<div style="font-size:10px; color:#74777F; text-align:center; border-top:1px solid #C4C6D0; padding:12px 0 40px;">${esc(t('report.footer'))}</div>`,
      0
    )

  document.body.appendChild(node)
  try {
    // Vị trí đầu mỗi khối (px CSS) để PDF ngắt trang giữa các khối, không cắt ngang biểu đồ.
    const blockTops = [...node.querySelectorAll('[data-blk]')].map((el) => el.offsetTop)
    const totalHeight = node.offsetHeight
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF' })
    return { canvas, blockTops, totalHeight }
  } finally {
    document.body.removeChild(node)
  }
}

function fileSafeLabel(periodLabel) {
  return periodLabel.replace(/[\s/,→]+/g, '-')
}

// Chia thành các trang A4: mỗi trang tối đa PAGE_H - 2*margin, ngắt tại đầu khối gần nhất.
function paginate(blockTops, totalHeight) {
  const usable = PAGE_H - PAGE_MARGIN_Y * 2
  const pages = []
  let start = 0
  while (totalHeight - start > usable) {
    const candidates = blockTops.filter((y) => y > start && y - start <= usable)
    const cut = candidates.length ? candidates[candidates.length - 1] : start + usable
    pages.push([start, cut])
    start = cut
  }
  pages.push([start, totalHeight])
  return pages
}

export async function exportStatsPdf(args) {
  // Nạp thư viện nặng khi thật sự cần (bấm xuất) để trang Thống kê mở nhanh hơn.
  const [{ canvas, blockTops, totalHeight }, { default: jsPDF }] = await Promise.all([buildReport(args), import('jspdf')])
  const scale = canvas.width / PAGE_W
  const pdf = new jsPDF({ unit: 'px', format: [PAGE_W, PAGE_H], orientation: 'portrait', hotfixes: ['px_scaling'] })
  const pages = paginate(blockTops, totalHeight)
  pages.forEach(([from, to], i) => {
    const sliceH = Math.min(canvas.height, Math.round(to * scale)) - Math.round(from * scale)
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceH
    const ctx = slice.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, Math.round(from * scale), canvas.width, sliceH, 0, 0, canvas.width, sliceH)
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, PAGE_MARGIN_Y, PAGE_W, sliceH / scale)
  })
  pdf.save(`moody-report-${fileSafeLabel(args.periodLabel)}.pdf`)
}

export async function exportStatsImage(args) {
  const { canvas } = await buildReport(args)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moody-report-${fileSafeLabel(args.periodLabel)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function statCard(label, value) {
  return `
    <div style="flex:1; border:1px solid #C4C6D0; border-radius:12px; padding:12px 14px;">
      <div style="font-size:11px; color:#44474E; margin-bottom:4px;">${esc(label)}</div>
      <div style="font-size:16px; font-weight:700; color:#191C20;">${esc(value)}</div>
    </div>
  `
}

function moodColor(avg) {
  const rounded = Math.round(avg)
  const m = moodByKey(['angry', 'sad', 'okay', 'good', 'great'][rounded - 1] || 'okay')
  return m ? m.color : '#9FB8C8'
}

// Xu hướng mood theo thời gian: cột + trục Y (0–5) có đường lưới + nhãn trục X (thưa bớt khi nhiều điểm).
function trendChart(series, accent) {
  const H = 140
  const step = series.length > 20 ? Math.ceil(series.length / 12) : 1
  const grid = [5, 4, 3, 2, 1, 0]
    .map(
      (v) => `<div style="position:absolute; left:0; right:0; top:${((5 - v) / 5) * H}px; border-top:1px ${v === 0 ? 'solid #C4C6D0' : 'dashed #E2E2E9'};"></div>
      <div style="position:absolute; left:-22px; top:${((5 - v) / 5) * H - 6}px; width:16px; text-align:right; font-size:9px; color:#74777F;">${v}</div>`
    )
    .join('')
  return `
    <div style="padding-left:24px;">
      <div style="position:relative; height:${H}px;">
        ${grid}
        <div style="position:absolute; inset:0; display:flex; align-items:flex-end; gap:4px; padding:0 4px;">
          ${series
            .map(
              (p) => `<div style="flex:1 1 0; min-width:0; display:flex; justify-content:center; align-items:flex-end; height:100%;">
                <div style="width:100%; max-width:22px; border-radius:3px 3px 0 0; background:${p.avg ? moodColor(p.avg) : 'transparent'}; height:${p.avg ? (p.avg / 5) * H : 0}px;"></div>
              </div>`
            )
            .join('')}
        </div>
      </div>
      <div style="display:flex; gap:4px; padding:4px 4px 0; margin-bottom:6px;">
        ${series.map((p, i) => `<div style="flex:1 1 0; min-width:0; text-align:center; font-size:8px; color:#74777F; white-space:nowrap;">${i % step === 0 ? esc(p.label) : ''}</div>`).join('')}
      </div>
      <div style="display:flex; align-items:center; gap:6px; font-size:10px; color:#44474E;">
        <span style="width:10px; height:10px; border-radius:2px; background:${accent};"></span>Mood (0–5)
      </div>
    </div>`
}

// Biểu đồ cột: emoji + nhãn dưới cột, số lần trên đầu cột.
function columnChart(items, { color } = {}) {
  const H = 130
  const max = Math.max(1, ...items.map((d) => d.count))
  return `
    <div style="display:flex; align-items:flex-end; gap:10px; height:${H + 22}px; border-bottom:1px solid #C4C6D0; padding:0 4px;">
      ${items
        .map(
          (d) => `<div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
            <div style="font-size:10px; line-height:12px; height:12px; color:#44474E; margin-bottom:4px;">${d.count}</div>
            <div style="width:100%; max-width:44px; border-radius:4px 4px 0 0; background:${d.color || color || '#6250D6'}; height:${Math.max(2, (d.count / max) * H)}px;"></div>
          </div>`
        )
        .join('')}
    </div>
    <div style="display:flex; gap:10px; padding:4px 4px 0; margin-bottom:10px;">
      ${items
        .map(
          (d) => `<div style="flex:1 1 0; min-width:0; text-align:center;">
            <div style="font-size:16px; line-height:22px; height:22px;">${esc(d.emoji)}</div>
            <div style="font-size:9px; line-height:14px; height:14px; color:#74777F; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(d.label)}</div>
          </div>`
        )
        .join('')}
    </div>`
}

function legendList(items, total) {
  return `<div style="display:flex; flex-wrap:wrap; gap:6px 14px; font-size:11px; color:#44474E;">
    ${items
      .map(
        (d) => `<span style="display:inline-flex; align-items:center; gap:5px;">
          <span style="width:9px; height:9px; border-radius:50%; background:${d.color || '#6250D6'};"></span>
          ${esc(d.emoji)} ${esc(d.label)} · ${d.count} (${Math.round((d.count / total) * 100)}%)
        </span>`
      )
      .join('')}
  </div>`
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
        <span>${esc(d.emoji)} ${esc(d.label)}</span>
      </div>`
    )
    .join('')
  return `
    <div style="display:flex; align-items:center; gap:36px;">
      <svg width="180" height="180" viewBox="0 0 180 180" style="flex:none;">${slices.join('')}</svg>
      <div style="flex:1;">${legend}</div>
    </div>`
}
