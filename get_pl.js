const ytpl = require('ytpl');
ytpl('PL1Qs5O4WqEJN30QwB4ug4zYe5mIAxv3mP').then(playlist => {
  playlist.items.forEach(item => {
    console.log(item.title + " | " + item.shortUrl);
  });
}).catch(err => {
  console.error(err);
});
