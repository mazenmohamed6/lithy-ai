import { MetadataRoute } from "next";

const APP_URL = "https://lithyai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/careers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/changelog`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${APP_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/features`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${APP_URL}/templates`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${APP_URL}/resume-templates`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/acceptable-use`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/cookies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/dmca`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/gdpr`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/refund`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/blog/how-to-ace-ats`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${APP_URL}/blog/ai-resume-tips`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${APP_URL}/blog/linkedin-optimization`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const industrySlugs = ["software-engineering", "marketing", "finance", "healthcare", "education", "sales", "retail", "hospitality", "construction", "manufacturing"];

  const industryEntries: MetadataRoute.Sitemap = industrySlugs.map((slug) => ({
    url: `${APP_URL}/resume-templates/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...industryEntries];
}
