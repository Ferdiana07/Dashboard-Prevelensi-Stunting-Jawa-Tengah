import { useEffect, useState } from 'react'
import { loadDataset } from '../lib/data'
import type { Dataset } from '../types'

export function useDataset() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    loadDataset(controller.signal).then(setData).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Data tidak dapat dibaca.')
    })
    return () => controller.abort()
  }, [])
  return { data, error }
}
