const redis = require('redis')

const client = redis.createClient();
client.on("error", (err) =>{
    throw err;
})
client.connect();

module.exports = client;