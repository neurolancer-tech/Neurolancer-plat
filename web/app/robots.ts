import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dashboard/', '/profile/', '/messages/', '/orders/'],
    },
    sitemap: 'https://neurolancer-9omq.vercel.app/sitemap.xml',
  }
}