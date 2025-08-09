const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
const User = require("../models/users");

const verifyUser = async (email, password) => {
    const person = await User.findOne({ email , password});
    if (!person) {
        return null;
    }else{
        return person;
    }
};

module.exports = { verifyUser };
