const jwt = require("jsonwebtoken");

const setUser = (user) => {
    return jwt.sign({
        _id : user._id,
        name : user.name,
        email : user.email,
    } , process.env.SECRET_KEY);
}

const getUser = (token) => {
    const vToken = jwt.verify(token , process.env.SECRET_KEY);
    return vToken;
}

module.exports = {
    setUser,
    getUser
}