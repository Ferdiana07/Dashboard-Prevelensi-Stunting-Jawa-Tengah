const decimal = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const number = (value: number) => {
  // Remove binary arithmetic noise at display time, e.g. 19.65 - 14 becomes
  // 5.649999999999999. Preserve the original values used by calculations.
  const displayValue = Number(value.toPrecision(15))
  return decimal.format(Object.is(displayValue, -0) ? 0 : displayValue)
}
export const percent = (value: number) => `${number(value)}%`
export const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)} pp`
