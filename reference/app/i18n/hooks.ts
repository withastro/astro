import { useParams } from 'next/navigation'
import { type Locale, type Namespace } from './config'
import { getTranslation } from './utils'

export function useTranslation(namespace: Namespace) {
  const params = useParams()
  const locale = params?.locale as Locale

  const t = async (key: string) => {
    return getTranslation(locale, namespace, key)
  }

  return { t }
} 