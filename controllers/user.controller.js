const {addUser, login, getProfile} = require('../services/user');
const asynchandler = require('../utils/asyncHandler');

const registerHandler = asynchandler(async(req, res) => {
    const {name,password, email, phone} = req.body;
    const result = await addUser({name, password, email, phone});
    const {id} = result;
    res.status(201).json({success: true, message: "berhassil menambahkan user", data: {id, name, email, phone}});
})

const loginHandler = async(req, res, next) => {
    try {
        const {email, password} = req.body;
        const result = await login({email, password});
        const {id, email: emailUser, token} = result;
        res.status(200).json({success: true, message: "berhasil login", data: {id, email: emailUser, token}});
    } catch (err) {
        next(err)
    }
}   

const profileHandler = async(req, res, next) => {
    try {
        const id = req.user.id;
        const result = await getProfile({id: Number(id)});
        res.status(200).json({success: true,message: "berhasil mengambil profile", data: result});
    } catch (err) {
        next(err)
    }
}   
module.exports = {registerHandler, loginHandler, profileHandler};