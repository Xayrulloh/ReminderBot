import i18next from 'i18next'
import uz from '../translate/translation.json'

const defaultNS = 'translation' as const

const resources = {
  uz: { translation: uz },
} as const

i18next.init({
  lng: 'uz',
  fallbackLng: 'uz',
  defaultNS,
  resources,
  interpolation: {
    escapeValue: false,
  },
})

export const { t } = i18next
export default i18next
