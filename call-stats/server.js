const http = require('http');
const path = require('path');
const url = require('url');
const fs = require('fs');
const port = 3000;

const contentTypes = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword'
};

http
  .createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;

    if (pathname === './') {
      pathname = './index.html';
    }

    const ext = path.parse(pathname).ext;
    const filepath = path.join(process.argv[2], pathname);

    fs.exists(filepath, (exist) => {
      if (!exist) {
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }

      if (fs.statSync(filepath).isDirectory()) {
        pathname += '/index' + ext;
      }

      fs.readFile(filepath, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'text/plain',
            'Cache-Control': 'no-cache'
          });
          res.end(data);
        }
      });
    });
  })
  .listen(port, (err) => {
    if(err) {
      return console.error('Something went wrong:', err);
    }

    console.log(`Server is listening on http://127.0.0.1:${port}`);
  });