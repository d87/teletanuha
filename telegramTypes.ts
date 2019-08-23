export interface TelegramUser {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}
export interface TelegramChat {
    id: number
    type: string
    title?: string
    username?: string
    first_name?: string
    last_name?: string
    // photo?: ChatPhoto
    description?: string
    // ...
}

export interface TelegramMessage {
    message_id: number
    from: TelegramUser
    date: number
    chat: TelegramChat
    // ...
    text?: string
    // document?: TelegramDocument  // Optional. Message is a general file, information about the file
    // photo?: [TelegramPhotoSize] // Optional. Message is a photo, available sizes of the photo
    // sticker?: TelegramSticker // Optional. Message is a sticker, information about the sticker
}
export interface TelegramUpdate {
    update_id: number
    message?: TelegramMessage
    edited_message?: TelegramMessage
    channel_post?: TelegramMessage
    edited_channel_post?: TelegramMessage
}
export interface TelegramUpdatesResponse {
    ok: boolean
    result: [TelegramUpdate]
}