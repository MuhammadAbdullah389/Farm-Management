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
        // Allow public routes through
        if (
            req.originalUrl.includes("/login") ||
            req.originalUrl.includes("/signup") ||
            req.originalUrl.includes("/verify") ||
            req.originalUrl.includes("/mailforUpdate") ||
            req.originalUrl.includes("/passOTPverify") ||
            req.originalUrl.includes("/updatepass")
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