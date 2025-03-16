// Special handler for ads.txt requests
module.exports = (req, res) => {
    // Handle both /ads.txt and /api/ads.js requests
    const pathName = req.url || '';
    if (pathName.endsWith('/ads.txt') || pathName === '/' || pathName === '') {
        // Set proper headers for text file
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Return the AdSense publisher ID
        return res.status(200).send('google.com, pub-5509985608150527, DIRECT, f08c47fec0942fa0');
    }

    // 404 for other paths
    return res.status(404).send('Not found');
}; 