const express = require("express")
const jwt = require("jsonwebtoken")
const config = require("config")
const router = express.Router()

const auth = require("../middleware/auth")
const grantedTokenAuth = config.get("grantedTokenAuth")

/**
 * Route        : POST /api/auth
 * Access       : Public
 * Description  : Melakukan otentikasi user
 */
router.post("/", auth, (req, res) => {
    // if (req.body.token != grantedTokenAuth) {
    //     return res.status(400, { success: false, message: "token mismatch!" })
    // }
    // const jwtToken = jwt.sign
    // return res.json(req.body)
})

module.exports = router
