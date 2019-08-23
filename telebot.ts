import querystring from "querystring"
import https from "https"
import { logger } from "./logger"
import { TelegramUpdatesResponse, TelegramUpdate } from './telegramTypes'
import { processReminder, loadReminders, clearTimeouts } from './reminders'
import { client, redisGET } from './redisClient'




const HOUR = 60 * 60 * 1000
const CHECK_INTERVAL = 0.5 * HOUR
const TELEGRAM_BOT_URL = "https://api.telegram.org/bot112285170:AAHtT1dHuA5NA0freaEz6lB33sRtHXXUKhg"
const SEND_MESSAGE_URL = TELEGRAM_BOT_URL + "/sendMessage"
const GET_UDPATES_URL = TELEGRAM_BOT_URL + "/getUpdates"
const LONG_POLL_TIMEOUT = 40000


export const sendMessage = (chatID: number, text: string, silent?: boolean) => {
    const params = {
        chat_id: chatID,
        disable_notification: silent,
        text: text
    }
    const url = SEND_MESSAGE_URL + "?" + querystring.stringify(params)
    https.get(url).on("error", err => {
        logger.error(err.message)
    })
}

const handleTextMessage = (msg: string, reply?: (text:string)=>void, chatID?: number, userID?: number) => {
    if (msg.toLowerCase().startsWith("/remind")) {
        processReminder(msg)
    }

    reply("OK")
}

const handleUpdate = (update: TelegramUpdate) => {
    if (update.message && update.message.text) {
        const replyFunc = sendMessage.bind(null, update.message.chat.id)
        handleTextMessage(update.message.text, replyFunc, update.message.chat.id, update.message.from.id)
    }
}

let currentSocket: NodeJS.Socket
const getUpdates = (offset?: number): Promise<TelegramUpdatesResponse> => {
    const headers = {}
    const botCommandArgs = {
        offset: offset,
        timeout: LONG_POLL_TIMEOUT
    }

    const reqURL = `${GET_UDPATES_URL}?${querystring.stringify(botCommandArgs)}`

    return new Promise((resolve, reject) => {
        https
            .get(reqURL, { headers, timeout: LONG_POLL_TIMEOUT + 5000 }, res => {
                let data = ""
                // A chunk of data has been recieved.
                res.on("data", chunk => {
                    data += chunk
                })

                // The whole response has been received.
                res.on("end", d => {
                    const dataString = data.toString()
                    resolve(JSON.parse(dataString))
                })
            })
            .on("socket", (socket: NodeJS.Socket) => {
                currentSocket = socket
            })
            .on("error", e => {
                reject(e)
            })
    })
}

let isShuttingDown = false
const shutdown = () => {
    isShuttingDown = true
    // logger.info("Shutting down...")
    clearTimeouts()
    if (currentSocket) {
        currentSocket.end()
    }
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

async function main() {

    loadReminders()

    let updateOffsetStr: string
    updateOffsetStr = await redisGET("updateOffset")
    let updateOffset = parseInt(updateOffsetStr, 10)

    while (!isShuttingDown) {
        try {
            const response = await getUpdates(updateOffset + 1)
            if (response.ok) {
                for (const update of response.result) {
                    handleUpdate(update)
                    updateOffset = update.update_id
                }
                client.set("updateOffset", updateOffset.toString())
            }
        } catch (err) {
            if (!isShuttingDown) throw err
        }
    }

    client.quit()
}

main()
