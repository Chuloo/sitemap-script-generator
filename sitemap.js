const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL = process.argv[2];

async function fetchHTML(url) {
  const { data } = await axios.get(url);
  return data;
}

async function getLinks(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);
  const pageLinks = [];
  $("a").each((index, element) => {
    const link = $(element).attr("href");
    if (
      link &&
      link.startsWith("/") &&
      !link.includes("#") &&
      !pageLinks.includes(link)
    ) {
      pageLinks.push(link);
    }
  });
  return pageLinks;
}

async function generateSitemap() {
  const crawledLinks = [BASE_URL];
  const toCrawlLinks = [BASE_URL];
  while (toCrawlLinks.length) {
    const currentLink = toCrawlLinks.pop();
    const links = await getLinks(currentLink);
    for (const link of links) {
      const fullLink = new URL(link, BASE_URL).href;
      if (!crawledLinks.includes(fullLink)) {
        crawledLinks.push(fullLink);
        toCrawlLinks.push(fullLink);
      }
    }
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  crawledLinks.forEach((link) => {
    sitemap += `
    <url>
        <loc>${link}</loc>
        <changefreq>weekly</changefreq>
    </url>`;
  });

  sitemap += "\n</urlset>";

  fs.writeFileSync("sitemap.xml", sitemap);
  console.log("Sitemap has been saved as sitemap.xml");
  console.log(`${crawledLinks.length} links added`);
}

generateSitemap();
