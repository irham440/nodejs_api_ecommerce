const jwt = require('jsonwebtoken');

const authMiddlewire = async (req, res, next) => {
    const header = req.headers.authorization ;
    console.log(header)
    if(!header){
        return res.status(401).json({message: "No token"});
    }
    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        console.log(req.user, req.user.id)
        next();
    } catch (error) {
        return res.status(403).json({message: "token invalid"});
    }
    

}

module.exports = {authMiddlewire};