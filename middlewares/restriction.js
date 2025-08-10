const { getUser } = require("../service/auth");
const curdate = require("../controllers/currentdate");
const Submission = require("../models/dailyRecord");

async function restriction(req, res, next) {
    try {
        const userUid = req.cookies?.tId;

        if (userUid) {
            const jwtToken = await getUser(userUid);  
            if (jwtToken) {
                const { name, role } = jwtToken;
                const cDate = curdate();

                const entry = await Submission.findOne({ date: curdate() });
                const encodedDate = encodeURIComponent(curdate());

                if (entry) {
                    return res.render("insertedHome", { 
                        msg: `Record against date ${curdate()} already exists`, 
                        username: name, 
                        date: curdate(), 
                        link: encodedDate, 
                        insertion: true 
                    });
                } else {
                    return res.render("home", { username: name, date: cDate });
                }
            } else {
                return res.redirect("/login");
            }
        }
        if (!req.originalUrl.includes("/login")) {
            return res.redirect("/login");
        }
        return res.render("login");
    } catch (error) {
        console.error("Authentication error:", error);
        return res.redirect("/login");
    }
}
module.exports = {
    restriction,
};