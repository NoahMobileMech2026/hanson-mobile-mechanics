export default function sitemap() {
  return [
    {
      url: "https://hanson-mobile-mechanics.vercel.app",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://hanson-mobile-mechanics.vercel.app/privacy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
