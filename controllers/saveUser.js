const User = require("../models/users"); 
const saveUserToDb = async (name, email, password) => {
  
  const newUser = new User({
    name,
    email,
    password,
  });
  await newUser.save();
  console.log("User saved to database successfully!");
};

module.exports = { saveUserToDb };
