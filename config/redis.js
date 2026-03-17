const redis = require('redis')

const redisClient = redis.createClient();
redisClient.on("error", (err) =>{
    throw err;
})
redisClient.connect();

module.exports = redisClient;