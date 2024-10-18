# Scrapy settings for aio_scrapy project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

# aio_scraper/aio_scraper/settings.py

BOT_NAME = 'aio_scraper'

SPIDER_MODULES = ['aio_scraper.spiders']
NEWSPIDER_MODULE = 'aio_scraper.spiders'

# Define the user-agent (optional) if needed for web scraping.
USER_AGENT = 'AIOScraper (+http://www.yourdomain.com)'

# Configure item pipelines if needed (for post-processing)
ITEM_PIPELINES = {
    'aio_scraper.pipelines.AioScraperPipeline': 300,
}

# Enable or adjust logging
LOG_LEVEL = 'INFO'

# Auto-throttle settings to avoid overwhelming target sites
AUTOTHROTTLE_ENABLED = True

# Obey robots.txt rules (disable if you need to scrape unrestricted)
ROBOTSTXT_OBEY = False

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"