const express = require('express');
const redisClient = require('../config/redis')
const app = express();

app.use(express.json())
app.set('trust proxy', true);

function rateLimit ({maxRequest, windowSecond, keyPrefix}){
    return async (req, res, next) => {

        const userId = req.body.email;
        const key = `${keyPrefix}:${userId}`;
        console.log(userId)
        try {
            const block = await redisClient.get(`${key}:block`);
            if (block){
                return res.status(429).json({message: "To many attempt"})

            }
                        
            let request = await redisClient.get(key);
            request = request ? parseInt(request): 0;
            request++;
            console.log(request)
            await redisClient.set(key, request, {EX: windowSecond});

            if (request > maxRequest){
                await redisClient.set(`${key}:block`, "true", {EX: windowSecond});
                return res.status(429).json({message: "To many request you block"})

        }
        } catch (err) {
            throw err;
        }
        next();
    };
}

module.exports = rateLimit;