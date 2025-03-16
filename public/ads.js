// This script helps serve ads.txt with the correct content type
module.exports = (req, res) => {
    if (req.url === '/ads.txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end('google.com, pub-5509985608150527, DIRECT, f08c47fec0942fa0');
    } else {
        res.status(404).end();
    }
}; 