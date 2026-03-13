const {addUser, login} = require("../services/createUser");
const asynchandler = require("../utils/asyncHandler");

const createUser = asynchandler(async(req, res) => {
    const {name,password, email} = req.body;
    const result = await addUser({name, password, email});
    res.status(200).json({message: "berhassil menambahkan user", result});
})

const loginUser = async(req, res, next) => {
    try {
        const {email, password} = req.body;
        const result = await login({email, password});
        res.status(200).json({result: result});
    } catch (err) {
        next(err)
    }
}   
module.exports = {createUser, loginUser};