const decimal = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const number = (value: number) => decimal.format(Object.is(value, -0) ? 0 : value)
export const percent = (value: number) => `${number(value)}%`
export const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)} pp`
