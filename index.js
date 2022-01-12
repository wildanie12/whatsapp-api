const { Client } = require("whatsapp-web.js")
const express = require("express")
const qrcodeTerminal = require("qrcode-terminal")
const qrcode = require("qrcode")
const fs = require("fs")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", require("./routes/auth_route"))
const authMiddleware = require("./middleware/auth")

// Method       : POST message/:phonenumber
// Access       : Private (token)
// Description  : Send a message to a whatsapp number via http request
app.post("/api/chat/message/", authMiddleware, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body
        if (!phoneNumber)
            return res.status(400).json({
                success: false,
                message: "Phone number is not specified",
            })
        if (!message)
            return res.status(400).json({
                success: false,
                message: "Phone number is not specified",
            })

        const result = await client.sendMessage(`${phoneNumber}@c.us`, message)
        res.json({ success: true, data: result })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            whatsappState: clientCurrentCond,
        }) // Whatsapp could be not ready yet
    }
})

// Method       : POST /api/chat/logout
// Access       : Private (token)
// Description  : Send a message to a whatsapp number via http request
app.post("/api/chat/logout", authMiddleware, (req, res) => {
    if (fs.existsSync(SESSION_FILE_PATH)) fs.unlinkSync(SESSION_FILE_PATH)
    delete clientConf.session
    client.destroy()
    client.initialize()

    io.emit("message", "logged out, please scan the upcoming qr code")

    return res.json({
        success: true,
        message: "logged out, please scan the qr code again",
    })
})

// Method       : POST /api/chat/ping
// Access       : public
// Description  : send a ping to the server to check service availability
app.post("/api/chat/ping", (req, res) => {
    res.json({ success: true, data: clientCurrentCond })
})

// Method       : GET /
// Access       : public
// Description  : Whatsapp interface console
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname + "/public" })
})

// Define Session
const SESSION_FILE_PATH = "./session.json"
let clientConf = { puppeteer: { headless: true }, restartOnAuthFail: true }
if (fs.existsSync(SESSION_FILE_PATH)) {
    clientConf.session = require(SESSION_FILE_PATH)
}

// Define Client
let clientCurrentCond = "connecting"
let client = new Client(clientConf)

// On Authenticated whatsapp
client.on("authenticated", (session) => {
    console.log("Authenticated: ", session)
    io.emit("message", "Authenticated")
    clientCurrentCond = "authenticated"
    // sessionData = session
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) console.log(err)
    })
})

// On authentication failure
client.on("auth_failure", (message) => {
    io.emit("message", `Auth Failure: ${message}`)
    console.log(`Auth failure: ${message}`)
    clientCurrentCond = "authentication failure"

    // if (fs.existsSync(SESSION_FILE_PATH)) fs.unlinkSync(SESSION_FILE_PATH)
    client.destroy()
    client.initialize()
})

// On disconnected whatsapp account
client.on("disconnected", (message) => {
    io.emit("message", `Disconnected Failure: ${message}`)
    console.log(`Disconnected: ${message}`)
    clientCurrentCond = "disconnected"

    // if (fs.existsSync(SESSION_FILE_PATH)) fs.unlinkSync(SESSION_FILE_PATH)
    // delete clientConf.session
    client.destroy()
    client.initialize()
})

// On ready whatsapp functionality
client.on("ready", () => {
    console.log("Ready")
    io.emit("message", "Ready!")
    clientCurrentCond = "ready"
})

// On whatsapp message
client.on("message", (msg) => {
    console.log(msg)
    if (msg.body == "Gud?") msg.reply("Gud")
    client.sendMessage()
})

// Init
client.initialize()

// Io Connection
io.on("connection", (socket) => {
    socket.send(clientCurrentCond)
    if (clientCurrentCond != "ready") socket.send("getting qr code...")
    // socket.emit("message", "Connecting to whatsapp....")
})
client.on("qr", (qr) => {
    clientCurrentCond = "authentication failure"
    qrcode.toDataURL(qr, (err, url) => {
        io.emit("qr", url)
        io.emit("message", "Qr retrieved")
    })
})

// Port
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`listening at ${PORT}`)
})
