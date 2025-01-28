interface NewsSource {
  name: string;
  url: string;
  type: "rss" | "atom";
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: "InfoQ",
    url: "https://feed.infoq.com/",
    type: "rss"
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    type: "rss"
  },
  {
    name: "Dev.to",
    url: "https://dev.to/feed/",
    type: "rss"
  },
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    type: "rss"
  },
  {
    name: "MLOps Substack",
    url: "https://mlops.substack.com/feed",
    type: "rss",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed",
    type: "rss",
  },
  {
    name: "KD Nuggets",
    url: "https://www.kdnuggets.com/feed",
    type: "rss",
  },
  {
    name: "Analytics Insight",
    url: "https://www.analyticsinsight.net/feed",
    type: "rss",
  },
  {
    name: "Artificial Intelligence News",
    url: "https://www.artificialintelligence-news.com/feed",
    type: "rss",
  },
  {
    name: "AI Magazine",
    url: "https://aimagazine.com/api/multi-feed?feedType=rss&limit=10&contentType=report&paged=1",
    type: "rss",
  },
  {
    name: "CIO",
    url: "https://www.cio.com/rss",
    type: "rss",
  },
  {
    name: "Nutanix",
    url: "https://www.nutanix.com/theforecastbynutanix.feed.rss.xml",
    type: "rss",
  },
];
