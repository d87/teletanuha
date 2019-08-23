import redis from "redis"
import { promisify } from "util"
import { logger } from "./logger"

const client = redis.createClient()
client.select(3, () => {
    logger.info("Selected Redis database 3")
})
client.on("error", err => {
    logger.error(err.message)
})
client.on("ready", err => {
    logger.info("Connected to Redis.")
})

const redisGET = promisify(client.get).bind(client)
const redisHGETALL = promisify(client.HGETALL).bind(client)

export { client, redisGET, redisHGETALL }