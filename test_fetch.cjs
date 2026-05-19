const https = require('https');
const options = {
  hostname: 'www.youtube.com',
  path: '/playlist?list=PL1Qs5O4WqEJN30QwB4ug4zYe5mIAxv3mP',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
  }
};
https.get(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    require('fs').writeFileSync('yt.html', body);
    console.log("Written", body.length, "bytes");
  });
});
