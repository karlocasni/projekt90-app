const https = require('https');
const options = {
  hostname: 'www.youtube.com',
  path: '/playlist?list=PL1Qs5O4WqEJN30QwB4ug4zYe5mIAxv3mP',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/ytInitialData\s*=\s*({.+?});/);
    if (match) {
      const json = JSON.parse(match[1]);
      try {
        const items = json.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
        items.forEach(item => {
          if (item.playlistVideoRenderer) {
            const v = item.playlistVideoRenderer;
            console.log(v.title.runs[0].text + " | https://youtube.com/watch?v=" + v.videoId);
          }
        });
      } catch (e) {
        console.log("Error parsing items:", e);
      }
    } else {
      console.log("No ytInitialData found");
    }
  });
});
