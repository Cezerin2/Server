var env = process.env.NODE_ENV || 'development';
var server = require(`./server.${env}`);
module.exports = server;
