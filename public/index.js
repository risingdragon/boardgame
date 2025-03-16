// Simple static content server
module.exports = (req, res) => {
    // Handle ads.txt directly
    if (req.url === '/ads.txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send('google.com, pub-5509985608150527, DIRECT, f08c47fec0942fa0');
        return;
    }

    // Default handling - redirect to main app
    res.writeHead(302, { Location: '/' });
    res.end();
}; 