'use strict';

let express = require('express');
let path = require('path');

let app = express();
let port = 9901;

app.use('/static/', express.static(path.join(__dirname, './static')));

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port, () => {
  console.log('Listening on ' + port);
});
