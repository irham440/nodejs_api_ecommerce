const {addUser, login} = require('../services/user');
const asynchandler = require('../utils/asyncHandler');

const createUser = asynchandler(async(req, res) => {
    const {name,password, email, phone} = req.body;
    const result = await addUser({name, password, email, phone});
    res.status(201).json({message: "berhassil menambahkan user", result});
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