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
    type: "rss"
  }
]; 
