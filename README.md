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
````

Make a Directory for cap-data
mkdir -p /usr/local/share/bettercap/ui/captured-data

Add Bettercap to your SystemPath!

AIO.cap
Use Bettercap's built-in HTTP UI to serve the captured data.
Capture and log sensitive information like usernames, passwords, and file uploads.
Display the captured data in the web UI in real-time.


**To Run:**
```` sudo bettercap -caplet AIO.cap ````
or
CMD/Powershell
```` bettercap -caplet AIO.cap ````

**Access the UI:**
Visit http://127.0.0.1/captured.html to see the captured credentials, uploads, and other data in real-time.


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



