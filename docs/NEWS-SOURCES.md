# News feed presets

Checked on 9 October 2026 using HomeBoard's production public HTTP transport and
RSS parser. All nine presets returned current stories. Publishers can change
feeds; Settings → Save & test feed checks the currently selected source.

| Source | Feed | Items at check |
|---|---|---:|
| BBC News | https://feeds.bbci.co.uk/news/rss.xml | 31 |
| CNBC Top News | https://www.cnbc.com/id/100003114/device/rss/rss.html | 30 |
| CNN via Google News | [Recent CNN stories](https://news.google.com/rss/search?q=site%3Acnn.com%20when%3A7d&hl=en-GB&gl=GB&ceid=GB%3Aen) | 100 |
| Fox News | https://moxie.foxnews.com/google-publisher/latest.xml | 25 |
| Sky News | https://feeds.skynews.com/feeds/rss/home.xml | 10 |
| GB News | https://www.gbnews.com/feeds/news.rss | 30 |
| The Guardian | https://www.theguardian.com/uk/rss | 139 |
| NPR | https://feeds.npr.org/1001/rss.xml | 10 |
| Al Jazeera | https://www.aljazeera.com/xml/rss/all.xml | 25 |

CNN's HTTPS legacy feeds reset the connection. Its HTTP latest feed was reachable,
but its newest item was dated 22 August 2024. The CNN preset therefore uses a
Google News search restricted to cnn.com and the past seven days. Its dropdown
label and hint identify this aggregator rather than claiming an official live
CNN RSS feed. Original publisher feeds are used for the other presets.

Only headlines and links are displayed. HomeBoard retains the existing custom
feed field, safe-text handling, public-DNS validation, bounded downloads and
cached-feed failure indicators. Presets do not change these protections.
