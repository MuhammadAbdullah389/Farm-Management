const User = require("../controllers/userSchema"); 
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
