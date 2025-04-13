import { useState } from 'react'

interface UseOptimisticOptions<T, U> {
  initialData: T
  updateFn: (currentState: T, newData: U) => T
}

export function useOptimistic<T, U>({ initialData, updateFn }: UseOptimisticOptions<T, U>) {
  const [optimisticData, setOptimisticData] = useState<T>(initialData)

  const updateOptimisticData = (newData: U) => {
    setOptimisticData(currentState => updateFn(currentState, newData))
  }

  return [optimisticData, updateOptimisticData] as const
} 