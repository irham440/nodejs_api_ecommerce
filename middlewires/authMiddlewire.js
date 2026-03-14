const jwt = require('jsonwebtoken');

const authMiddlewire = async (req, res, next) => {
    const header = req.headers.authorization ;
    if(!header){
        return res.status(401).json({message: "No token"});
    }
    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        return req.user,
        next();
    } catch (error) {
        return res.status(403).json({message: "token invalid"});
    }
    

}

module.exports = {authMiddlewire};