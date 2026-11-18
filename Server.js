
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(".");
const port = 8080;

const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".wasm": "application/wasm",
    ".data": "application/octet-stream",
    ".json": "application/json",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
};

http.createServer((req, res) => {
    let urlPath;

    try {
        urlPath = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname
        );
    } catch {
        res.writeHead(400).end("Bad request");
        return;
    }

    if (urlPath.includes("\0")) {
        res.writeHead(400).end("Bad request");
        return;
    }

    let filePath = path.resolve(root, "." + urlPath);

    if (filePath !== root &&
        !filePath.startsWith(root + path.sep)) {
        res.writeHead(403).end("Forbidden");
        return;
    }

    if (urlPath.endsWith("/")) {
        filePath = path.join(filePath, "index.html");
    }

    // Keep the .br file, but identify its original file type.
    const isBrotli = filePath.endsWith(".br");
    const originalPath = isBrotli
        ? filePath.slice(0, -3)
        : filePath;

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404).end("File not found");
            return;
        }

        const ext = path.extname(originalPath);

        res.setHeader(
            "Content-Type",
            mimeTypes[ext] || "application/octet-stream"
        );

        if (isBrotli) {
            res.setHeader("Content-Encoding", "br");
        }

        res.setHeader("Content-Length", data.length);
        res.writeHead(200);
        res.end(data);
    });
}).listen(port, () => {
    console.log(`Serving Unity build at http://localhost:${port}`);
});
