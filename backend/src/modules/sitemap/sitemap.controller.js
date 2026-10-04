import { generateSitemapXml } from './sitemap.service.js';

export const getSitemap = async (req, res, next) => {
  try {
    const xml = await generateSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
};
