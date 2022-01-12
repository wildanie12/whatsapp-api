const jwt = require("jsonwebtoken")
const config = require("config")
const grantedTokenAuth = config.get("grantedTokenAuth")

module.exports = (req, res, next) => {
    token = req.header("X-Auth-Token")
    if (!token)
        return res
            .status(401)
            .json({ success: false, message: "No Token, authorization denied" })

    if (token != grantedTokenAuth)
        return res
            .status(401)
            .json({ success: false, message: "Auth Token invalid" })
    next()
}
