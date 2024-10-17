# BetterCap-AIO
BetterCap-AIO script for images, videos, username + Password

Download the files and place them in the corresponding dir's:
````
C:\ProgramData\bettercap\caplets\bk-aio\AIO.cap

C:\ProgramData\bettercap\caplets\bk-aio\AIO.JavaScript

C:\ProgramData\bettercap\caplets\bk-aio\dtp_attack.Python

C:\ProgramData\bettercap\caplets\bk-aio\vlan_hopping.Python

C:\ProgramData\bettercap\caplets\bk-aio\aio_scrapy\spiders\captured_data_spider

C:\ProgramData\bettercap\caplets\bk-aio\aio_scrapy\spiders\exploit_spider

C:\ProgramData\bettercap\caplets\bk-aio\aio_scrapy\settings.Python

/usr/local/share/bettercap/ui/captured.html

/usr/local/share/bettercap/ui/js/enhanced-capture.js
````

Make a Directory for cap-data
mkdir -p /usr/local/share/bettercap/ui/captured-data

Add Bettercap to your SystemPath!

AIO.cap
Use Bettercap's built-in HTTP UI to serve the captured data.
Capture and log sensitive information like usernames, passwords, and file uploads.
Display the captured data in the web UI in real-time.

enchanced-capture.js
Capture usernames, passwords, image uploads, and video uploads.
Write the captured data into a text file that will be served via the UI.
Display the captured data dynamically in the UI.

**To Run:**
```` sudo bettercap -caplet AIO.cap ````

**Access the UI:**
Visit http://127.0.0.1/captured.html to see the captured credentials, uploads, and other data in real-time.


Summary
AIO.cap captures usernames, passwords, and media uploads, and it saves the data to files.
AIO.js enhances the capture logic and dynamically logs the data.
The Bettercap UI displays the captured data, refreshing automatically.
Added Start/Stop buttons for the http-ui for dtp+vlanhop(needs testing)


Need to edit Settings.py
````
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
FEED_EXPORT_ENCODING = "utf-8"**

````

---
V2 - Python Install
---
Install Python from main site:
https://www.python.org/downloads/

Checking if Python is Installed
Before installing PIP, you need to ensure that Python is already installed on your system. You can check this by running the following command in the command prompt

python --version
If it is installed, You will see something like this:

Python 3.x.x

---
V2 - Scrapy install
---
Run the following command to install Scrapy using pip:
pip install scrapy

Confirm installation by running:
scrapy --version

Finding the Directory:
Open CMD/PS
python -m site --user-site

C:\Users\<USERNAME>\AppData\Roaming\Python\Python313\site-packages

---
V2 - Integrating Scrappy to Bettercap Caplets
---

Inside the site-packages directory, you'll find Scrapy installed. However, for usage purposes, Scrapy will execute from your Python installation path. The scrapy command should be available globally once installed via pip.

1. Scrapy Project Creation and Setup
Navigate to your bettercap directory, for example:
cd C:\ProgramData\bettercap\caplets\bk-aio

Then create the Scrapy project:
scrapy startproject aio_scrapy

This will generate the default Scrapy project structure in C:\ProgramData\bettercap\caplets\bk-aio\aio_scrapy.



