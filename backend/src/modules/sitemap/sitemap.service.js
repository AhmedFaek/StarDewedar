import prisma from '../../utils/prisma.js';

const escapeXml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Generates an XML sitemap adhering to Sitemaps XML Protocol 0.9.
 * Queries live products, projects, and categories from the database.
 */
export async function generateSitemapXml() {
  const baseUrl = (process.env.FRONTEND_URL || 'https://stardewedar.com').replace(/\/$/, '');

  const [products, projects, categories] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.project.findMany({
      select: { id: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.category.findMany({
      select: { id: true, type: true, updated_at: true },
    }),
  ]);

  const urls = [];

  // 1. Static Core Pages
  urls.push({
    loc: `${baseUrl}/`,
    changefreq: 'weekly',
    priority: '1.0',
  });
  urls.push({
    loc: `${baseUrl}/products`,
    changefreq: 'daily',
    priority: '0.9',
  });
  urls.push({
    loc: `${baseUrl}/projects`,
    changefreq: 'weekly',
    priority: '0.8',
  });
  urls.push({
    loc: `${baseUrl}/about`,
    changefreq: 'monthly',
    priority: '0.7',
  });
  urls.push({
    loc: `${baseUrl}/contact`,
    changefreq: 'monthly',
    priority: '0.7',
  });

  // 2. Dynamic Products
  for (const product of products) {
    urls.push({
      loc: `${baseUrl}/product-detail?id=${product.id}`,
      lastmod: formatDate(product.updated_at),
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // 3. Dynamic Projects
  for (const project of projects) {
    urls.push({
      loc: `${baseUrl}/project-detail?id=${project.id}`,
      lastmod: formatDate(project.updated_at),
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  // 4. Category Filter Pages
  for (const cat of categories) {
    if (cat.type === 'product' || cat.type === 'both') {
      urls.push({
        loc: `${baseUrl}/products?category=${cat.id}`,
        lastmod: formatDate(cat.updated_at),
        changefreq: 'weekly',
        priority: '0.6',
      });
    }
    if (cat.type === 'project' || cat.type === 'both') {
      urls.push({
        loc: `${baseUrl}/projects?category=${cat.id}`,
        lastmod: formatDate(cat.updated_at),
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }

  // Build XML String
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const item of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    if (item.lastmod) {
      xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    }
    if (item.changefreq) {
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    }
    if (item.priority) {
      xml += `    <priority>${item.priority}</priority>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  return xml;
}
