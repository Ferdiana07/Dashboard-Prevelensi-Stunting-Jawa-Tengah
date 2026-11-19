const decimal = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Round half away from zero on the exact decimal value. Binary noise such as
// 19.65 - 14 = 5.649999999999999 is removed first (12 significant digits is far
// below the 2-decimal precision of the source data), then the decimal point is
// shifted through exponent notation so the tie is never judged on a float product.
export function roundHalfAway(value: number, digits = 1) {
  if (!Number.isFinite(value)) return value
  const clean = Number(Math.abs(value).toPrecision(12))
  const text = String(clean)
  const scaled = text.includes('e') ? Math.round(clean * 10 ** digits) / 10 ** digits : Number(`${Math.round(Number(`${text}e${digits}`))}e-${digits}`)
  return value < 0 && scaled !== 0 ? -scaled : scaled
}
// Display helpers: one decimal, Indonesian decimal comma.
export const number = (value: number) => decimal.format(roundHalfAway(value, 1))
export const percent = (value: number) => `${number(value)}%`
export const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)} pp`
