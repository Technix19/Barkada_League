import { useOutletContext } from 'react-router-dom'

export function useLeague() {
  return useOutletContext()
}
