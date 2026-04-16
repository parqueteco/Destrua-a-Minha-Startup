const https = require('https');
https.get('https://parqueteco.github.io/Destrua-a-Minha-Startup/package.json', (res) => {
  console.log(res.statusCode);
  process.exit(0);
});
