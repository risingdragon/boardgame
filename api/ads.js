// Special handler for ads.txt requests
module.exports = (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send('google.com, pub-5509985608150527, DIRECT, f08c47fec0942fa0');
}; 