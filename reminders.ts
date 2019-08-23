// import redis from 'redis'
import { client, redisHGETALL } from './redisClient'
import { sendMessage } from './telebot'

const pattern = /(?:(\d{0,3})h)|(?:(\d{0,4})m)/gi

const split = (string, delimiter, n) => {
    const parts = string.split(delimiter);
    return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
}

export const timeParse = (timeStr: string) => {
    let time = 0
    while (true) {
        const array = pattern.exec(timeStr)
        if (array === null) break
        const hour = array[1]
        const min = array[2]
        if (hour)
            time += parseInt(hour,10)*60
        if (min)
            time += parseInt(min,10)
    }
    return time
}

const activeReminders = {}
export const scheduleReminder = (timestamp: number, text: string) => {
    const now = Date.now()
    const diff = timestamp - now
    if (diff <= 0) return
    console.log("scheduling...")
    const timeout = setTimeout(() => {
        fireReminder(timestamp)
    }, diff)
    activeReminders[timestamp] = { timeout, text }
}
export const fireReminder = (timestamp: number) => {
    const obj = activeReminders[timestamp]
    sendMessage(92475549, obj.text)
    // console.log("sending message... "+obj.text)
    delete activeReminders[timestamp]
    client.hdel("reminders", timestamp.toString())
}
export const saveReminder = (timestamp: number, text: string) => {
    client.hset("reminders", timestamp.toString(), text)
}

export const processReminder = (msg: string) => {
    const cmd = split(msg," ",3)
    const minutes = timeParse(cmd[1])
    if (minutes === 0) return
    const text = cmd[2] || "reminder"

    const diff = minutes*60*1000
    const now = Date.now()
    const timestamp = now+diff
    scheduleReminder(timestamp, text)
    saveReminder(timestamp, text)
}



export const loadReminders = async () => {
    let reminders = await redisHGETALL("reminders") as any
    if (reminders === null)
        reminders = {}

    // tslint:disable-next-line: forin
    for (const timestampStr in reminders) {
        const text = reminders[timestampStr]
        const timestamp = parseInt(timestampStr,10)
        scheduleReminder(timestamp, text)
    }
    console.log(reminders)
}

export const clearTimeouts = () => {

    // tslint:disable-next-line: forin
    for (const timestamp in activeReminders) {
        const obj = activeReminders[timestamp]
        clearTimeout(obj.timeout)
    }
}