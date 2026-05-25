import { useEffect } from 'react'
import { LEGAL } from '@/config/legal.constants'

type PortalPageMeta = {
  title: string
  description?: string
  robots?: string
  canonical?: string
}

export function usePortalPageMeta(meta: PortalPageMeta): void {
  useEffect(() => {
    const fullTitle = meta.title.includes('AlloTech72')
      ? meta.title
      : `${meta.title} — AlloTech72`

    document.title = fullTitle

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (meta.description) {
      setMeta('description', meta.description)
      setMeta('og:description', meta.description, 'property')
    }

    setMeta('og:title', fullTitle, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:site_name', LEGAL.companyName, 'property')

    if (meta.robots) setMeta('robots', meta.robots)

    const canonical = meta.canonical ?? `${LEGAL.portalUrl}${window.location.pathname}`
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical

    return () => {
      document.title = `Portail client — ${LEGAL.companyName}`
    }
  }, [meta.title, meta.description, meta.robots, meta.canonical])
}
