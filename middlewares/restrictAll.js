const { getUser } = require("../service/auth");

async function restrictAll(req, res, next) {
    try {
        const userUid = req.cookies?.tId;

        if (userUid) {
            const jwtToken = await getUser(userUid);  
            if (jwtToken) {
                return next();
            }
        }
        // If not authenticated, allow /login and /signup routes through
        if (
            req.originalUrl.includes("/login") ||
            req.originalUrl.includes("/signup")
        ) {
            return next();
        }
        // Otherwise, redirect to login
        return res.redirect("/login");
    } catch (error) {
        console.error("Authentication error:", error);
        return res.redirect("/login");
    }
}
module.exports = {
    restrictAll,
};