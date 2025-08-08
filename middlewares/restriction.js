const { getUser } = require("../service/auth");
const curdate = require("../controllers/currentdate");

async function restriction(req, res, next) {
    try {
        const userUid = req.cookies?.tId;

        if (userUid) {
            const jwtToken = await getUser(userUid);  
            if (jwtToken) {
                const { name } = jwtToken;
                const str = `${name}`
                const cDate = curdate();
               return res.render("home" , { username : str , date : cDate});
            }
        }
        if (!req.originalUrl.includes("/login")) {
            return res.redirect("/login");
        }
        return res.render("login");
        
    } catch (error) {
        console.error("Authentication error:", error);
        res.redirect("/login");
    }}
module.exports = {
    restriction,
};
