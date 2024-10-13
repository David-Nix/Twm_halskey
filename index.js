var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import TelegramBot from "node-telegram-bot-api";
import { v4 as uuidv4 } from "uuid";
import Database from "./database.js";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync, createReadStream } from "fs";
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
process.env["NTBA_FIX_350"] = "1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3000;
const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error("BOT_TOKEN is not defined");
}
const bot = new TelegramBot(token, {
    filepath: false,
    polling: true,
});
const TWM_ADMIN = Number(process.env.OWNER);
const INCENIX = Number(process.env.INCENIX);
const authorize = (chatId) => {
    if (chatId === INCENIX || chatId === TWM_ADMIN) {
        return true;
    }
    else {
        return false;
    }
};
const messageVideoDetails = {
    width: 622,
    height: 1280,
    path: "/brand/TWM_Video_Instructions.mp4"
};
const db = new Database("tradewithmatthew");
const channelId = db.getChannelId();
// const channelId: ChatId = Number(process.env.ATOMIX); //test
class Session {
    constructor() {
        this.getPresentSession = () => {
            const now = new Date();
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
            const londonOffset = 1;
            const londonTime = new Date(utcTime + (londonOffset * 3600000));
            const hours = londonTime.getHours();
            const minutes = londonTime.getMinutes();
            const timeInMinutes = hours * 60 + minutes;
            console.log(`Present time (Timezone: London): ${hours}:${minutes} ${(hours > 12) ? 'PM' : 'AM'}`);
            const overnightStart = 6 * 60;
            const overnightEnd = 11 * 60;
            const morningStart = 11 * 60 + 1;
            const morningEnd = 17 * 60;
            const afternoonStart = 17 * 60 + 1;
            const afternoonEnd = 23 * 60 + 59;
            if (timeInMinutes >= overnightStart && timeInMinutes <= overnightEnd) {
                return "OVERNIGHT";
            }
            else if (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) {
                return "MORNING";
            }
            else if (timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd) {
                return "AFTERNOON";
            }
            else {
                return "OUTSIDE";
            }
        };
        this.returnEmoji = (count) => {
            const numberToEmoji = {
                0: '0⃣',
                1: '1⃣',
                2: '2⃣',
                3: '3⃣',
                4: '4⃣',
                5: '5⃣',
                6: '6⃣',
                7: '7⃣',
                8: '8⃣',
                9: '9⃣'
            };
            const ogNumberString = count.split('');
            const modNumberString = ogNumberString.map((num) => numberToEmoji[Number(num)]);
            const modString = modNumberString.join('');
            return modString;
        };
        this.downloadAndSavePhoto = (fileId) => __awaiter(this, void 0, void 0, function* () {
            let fileUrl = "";
            if (fileId !== undefined) {
                try {
                    const filetoGet = yield bot.getFile(fileId);
                    fileUrl = `https://api.telegram.org/file/bot${token}/${filetoGet.file_path}`;
                    console.log("Photo url tracked...");
                }
                catch (err) {
                    console.log("Error downloading photo");
                    console.error(err);
                }
            }
            else {
                console.log("No photo found ...or photo has no file_id");
            }
            return fileUrl;
        });
        this.downloadMarkedPhoto = (url) => __awaiter(this, void 0, void 0, function* () {
            let filename = null;
            let filePath = "";
            try {
                const response = yield axios({
                    url,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                filename = `${uuidv4()}.png`;
                filePath = join(__dirname, '../media/imgs', filename);
                writeFileSync(filePath, response.data, 'binary');
                return { status: true, filename, filePath };
            }
            catch (error) {
                console.error('Error downloading the image:', error);
                return { status: false, filename: null, filePath: null };
            }
        });
        this.checkSessionValidity = () => __awaiter(this, void 0, void 0, function* () {
            const presentSession = this.getPresentSession();
            const nullResultSignals = yield db.validate(presentSession);
            console.log("DB Validated: ", nullResultSignals);
            return (nullResultSignals.length === 0);
        });
        this.getSessionAccuracy = (wins, losses) => {
            const totalSignals = wins + losses;
            const per = wins / totalSignals;
            return {
                status: true,
                percentage: `${(per * 100).toFixed(2)}%`
            };
        };
        this.getDayFormatted = (date = null) => {
            const today = date ? new Date(date) : new Date();
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const dayOfMonth = today.getDate();
            const ordinalSuffix = (n) => ['th', 'st', 'nd', 'rd'][((n % 100) - 20) % 10] || 'th';
            return `${daysOfWeek[today.getDay()]}, ${months[today.getMonth()]} ${dayOfMonth}${ordinalSuffix(dayOfMonth)}, ${today.getFullYear()}`;
        };
        this.sendSessionEndMessage = (presentSession, historyDB) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionEndPhotoPath = join(__dirname, "../media/imgs/brand/session_end.jpg");
                const sessionEndPhotoStream = createReadStream(sessionEndPhotoPath);
                const countWinsAndLosses = (history) => {
                    return history.reduce((acc, entry) => ({
                        wins: acc.wins + (entry.result.includes("WIN") ? 1 : 0),
                        losses: acc.losses + (!(entry.result.includes("WIN")) ? 1 : 0),
                    }), { wins: 0, losses: 0 });
                };
                const sessionResult = countWinsAndLosses(historyDB);
                let sessionIcon = "";
                switch (presentSession) {
                    case "OVERNIGHT":
                        sessionIcon = "🌑";
                        break;
                    case "MORNING":
                        sessionIcon = "🌙";
                        break;
                    case "AFTERNOON":
                        sessionIcon = "☀";
                        break;
                    default:
                        break;
                }
                let SESSION_END_MSG = `<strong>📝 REPORT</strong>\n`;
                SESSION_END_MSG += `<strong>${sessionIcon} ${presentSession} SESSION</strong>\n\n`;
                SESSION_END_MSG += `<blockquote>`;
                historyDB.map((history) => {
                    SESSION_END_MSG += `<code><strong>${history.initial_time} • ${history.pair} • ${(history.result !== null) ? history.result.split("-")[0] : history.direction}</strong></code>\n`;
                });
                SESSION_END_MSG += `</blockquote>\n`;
                SESSION_END_MSG += `<strong>${(sessionManager.returnEmoji(sessionResult.wins.toString()))} ${(sessionResult.wins > 1) ? "WINS" : "WIN"} - ${(sessionManager.returnEmoji(sessionResult.losses.toString()))} ${(sessionResult.losses > 1) ? "LOSSES" : "LOSS"}</strong>\n\n`;
                const accuracy = this.getSessionAccuracy(sessionResult.wins, sessionResult.losses);
                SESSION_END_MSG += `<strong>❇️ Accuracy: ${accuracy.percentage}</strong>\n\n`;
                SESSION_END_MSG += `<strong>JOIN THE NEXT TRADE SESSION CLICK THE LINK BELOW 👇</strong>`;
                bot.sendPhoto(channelId, sessionEndPhotoStream, {
                    parse_mode: "HTML",
                    caption: SESSION_END_MSG,
                    reply_markup: {
                        "inline_keyboard": [
                            [{ "text": "CREATE AN ACCOUNT HERE", "url": "https://shorturl.at/cehnV" }],
                            [{ "text": "OPEN BROKER HERE", "url": "https://shorturl.at/cehnV" }],
                            [{ "text": "CONTACT SUPPORT HERE", "url": "https://t.me/twmsupports" }]
                        ]
                    }
                }, {
                    contentType: "application/octet-stream"
                });
            }
            catch (error) {
                console.error(error);
            }
        });
        this.endSession = (chatId_1, ...args_1) => __awaiter(this, [chatId_1, ...args_1], void 0, function* (chatId, called = false) {
            const presentSession = this.getPresentSession();
            const signalHistory = yield db.getSessionSignals(presentSession);
            if (called && signalHistory.length === 0) {
                bot.sendMessage(chatId, "No signal has been sent this session, so there's nothing to end");
                return;
            }
            if (signalHistory.length !== 0) {
                try {
                    const options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Yes', callback_data: 'yes' },
                                    { text: 'No', callback_data: 'no' }
                                ]
                            ]
                        }
                    };
                    bot.sendMessage(chatId, `Do you want to post the session end message for ${presentSession} session?`, options)
                        .then((sentMessage) => __awaiter(this, void 0, void 0, function* () {
                        const messageId = sentMessage.message_id;
                        const sessionCanEnd = yield this.checkSessionValidity();
                        const timeoutId = setTimeout(() => {
                            if (!sessionCanEnd) {
                                bot.sendMessage(chatId, "Session has a signal without a result, can't end session yet...");
                                return;
                            }
                            if (sessionCanEnd) {
                                this.sendSessionEndMessage(presentSession, signalHistory);
                                botManager.setLastBotMessageId(chatId, 0);
                                bot.editMessageText("Session end message successfully posted...automatically", {
                                    chat_id: chatId,
                                    message_id: messageId
                                });
                                console.log("---------------------------------");
                                console.log("------- SESSION ENDED -----------");
                            }
                        }, 5 * 60 * 1000);
                        bot.on('callback_query', callbackQuery => {
                            var _a;
                            if (((_a = callbackQuery.message) === null || _a === void 0 ? void 0 : _a.message_id) === messageId) {
                                clearTimeout(timeoutId);
                                const response = callbackQuery.data;
                                if (response === 'yes' && sessionCanEnd) {
                                    if (!sessionCanEnd) {
                                        bot.sendMessage(chatId, "Session has a signal without a result, can't end session yet...");
                                        return;
                                    }
                                    sessionManager.sendSessionEndMessage(presentSession, signalHistory);
                                    botManager.setLastBotMessageId(chatId, 0);
                                    bot.editMessageText("Session end message successfully posted...", {
                                        chat_id: chatId,
                                        message_id: messageId
                                    });
                                    console.log("---------------------------------");
                                    console.log("------- SESSION ENDED -----------");
                                }
                                if (response === 'no' && sessionCanEnd) {
                                    bot.editMessageText("Okay, but you will need to end the session manually...YOURSELF", {
                                        chat_id: chatId,
                                        message_id: messageId
                                    });
                                }
                            }
                        });
                    }));
                }
                catch (err) {
                    bot.sendMessage(chatId, "Unable to send session end message for some reason. Please try again..");
                }
            }
        });
        this.endDay = (chatId) => __awaiter(this, void 0, void 0, function* () {
            bot.sendMessage(chatId, "Please wait... curating signals")
                .then((sentMessage) => __awaiter(this, void 0, void 0, function* () {
                const dayHistory = yield db.getDaySignals();
                const sessions = {
                    OVERNIGHT: 'OVERNIGHT SESSION',
                    MORNING: 'MORNING SESSION',
                    AFTERNOON: 'AFTERNOON SESSION'
                };
                let tWins = 0;
                let tLosses = 0;
                const countWinsAndLosses = (history) => {
                    const { wins, losses } = history.reduce((acc, signal) => {
                        if (signal.result && signal.result.includes("WIN")) {
                            acc.wins += 1;
                        }
                        else {
                            acc.losses += 1;
                        }
                        return acc;
                    }, { wins: 0, losses: 0 });
                    tWins += wins;
                    tLosses += losses;
                };
                countWinsAndLosses(dayHistory);
                let mts = `<strong>🧾 DAILY REPORT</strong>\n`;
                mts += `<strong>🗓 ${this.getDayFormatted()}</strong>\n\n`;
                mts += `<pre>\n`;
                Object.keys(sessions).forEach(session => {
                    mts += `<strong>${sessions[session]}</strong>\n<strong><code>➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖</code></strong>\n`;
                    dayHistory.filter(item => item.session === session)
                        .forEach(item => {
                        mts += `<strong><code>${item.initial_time} • ${item.pair} • ${(item.result !== null) ? item.result.split("-")[0] : item.direction}</code></strong>\n`;
                    });
                    mts += '\n';
                });
                mts += `</pre>\n`;
                mts += `<strong>${sessionManager.returnEmoji(tWins.toString())} ${(tWins > 1) ? "WINS" : "WIN"} - ${sessionManager.returnEmoji(tLosses.toString())} ${(tLosses > 1) ? "LOSSES" : "LOSS"}</strong>\n\n`;
                const accuracy = this.getSessionAccuracy(tWins, tLosses);
                mts += `<strong>❇️ Accuracy: ${accuracy.percentage}</strong>\n\n`;
                mts += `<strong>JOIN THE NEXT TRADE SESSION CLICK THE LINK BELOW 👇</strong>`;
                bot.deleteMessage(chatId, sentMessage.message_id)
                    .then(() => __awaiter(this, void 0, void 0, function* () {
                    console.log("Sending message...");
                    yield bot.sendMessage(channelId, mts, {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "SHARE TESTIMONY", url: "https://t.me/twmsupports" }],
                                [{ text: "LEARN HOW TO TRADE", url: "https://telegra.ph/STRICT-INSTRUCTIONS-ON-HOW-TO-TRADE-SUCCESSFULLY-02-09" }],
                            ]
                        }
                    }).then(() => __awaiter(this, void 0, void 0, function* () {
                        yield bot.sendMessage(chatId, "Day End Message Sent Successsfully!");
                        console.log('|===>> DAILY REPORT SENT SUCCESSFULLY <<===|');
                    }));
                }));
            }));
        });
        this.analysePastWeek = () => __awaiter(this, void 0, void 0, function* () {
            console.log("Getting all signals from the past 7 days...");
            const weekSignals = yield db.getWeekSignals();
            let daysSorter = {};
            let totalWins = 0;
            let totalLosses = 0;
            weekSignals.forEach((signal) => {
                const dateFormatted = this.getDayFormatted(signal.time_stamp);
                if (dateFormatted in daysSorter) {
                    daysSorter[dateFormatted].push(signal);
                }
                else {
                    daysSorter[dateFormatted] = [signal];
                }
            });
            console.log("");
            console.log("___________________________");
            console.log("Generating weekly report...");
            let mts = `<strong>🧾 #WEEKLYSUMMARY</strong>\n\n`;
            mts += `🗓 FROM: <strong>${Object.keys(daysSorter).at(0)}.</strong>\n`;
            mts += `🗓 TO: <strong>${Object.keys(daysSorter).at(-1)}.</strong>\n\n`;
            console.log("");
            console.log(`FROM: ${Object.keys(daysSorter).at(0)}`);
            console.log(`TO: ${Object.keys(daysSorter).at(-1)}`);
            console.log("");
            mts += `<pre>`;
            Object.keys(daysSorter).forEach(day => {
                const daySignals = daysSorter[day];
                mts += `<strong>${day}.</strong>\n`;
                mts += `<strong>➖➖➖➖➖➖➖➖➖➖➖➖➖</strong>\n`;
                let dayWins = 0;
                let dayLosses = 0;
                daySignals.forEach((signal) => {
                    if (signal.result && signal.result.includes("WIN")) {
                        dayWins += 1;
                        totalWins += 1;
                    }
                    else {
                        dayLosses += 1;
                        totalLosses += 1;
                    }
                });
                mts += `<strong>✅ Wins ${this.returnEmoji(dayWins.toString())} x ${this.returnEmoji(dayLosses.toString())} Losses ❌</strong>\n`;
                const accuracy = this.getSessionAccuracy(dayWins, dayLosses);
                mts += `<strong>❇️ Accuracy: ${accuracy.percentage}</strong>\n\n`;
            });
            mts += `</pre>\n`;
            mts += `<strong>🥇 <u>OVERALL WEEKLY PERFORMANCE</u></strong>\n`;
            mts += `<strong>➖➖➖➖➖➖➖➖➖➖➖➖➖</strong>\n`;
            mts += `✅ Total Wins: ${totalWins}\n`;
            mts += `❌ Total Losses: ${totalLosses}\n\n`;
            const weekAccuracy = this.getSessionAccuracy(totalWins, totalLosses);
            mts += `🎯 Weekly Accuracy: ${weekAccuracy.percentage}`;
            console.log(`Week's Accuracy: ${weekAccuracy.percentage}`);
            console.log("___________________________");
            return mts;
        });
        this.scheduleClimaxCrons = () => __awaiter(this, void 0, void 0, function* () {
            console.log("Will schedule all Channel crons...");
            const cronScheduleArray = yield db.getChannelCrons();
            const cronPosts = yield db.getChannelCronPosts();
            cronScheduleArray.forEach((cronJob, idx1) => {
                // console.log(`Running ${cronJob.name} job at..`);
                cronJob.schedule.forEach((cronExpression) => {
                    if (cronJob.cron_id === "session_end") {
                        cron.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
                            const lastController = botManager.getLastAdmin();
                            console.log("Sending message for ", cronJob.cron_id);
                            yield sessionManager.endSession(lastController);
                        }), { timezone: cronJob.timezone });
                    }
                    else if (cronJob.cron_id === "day_end") {
                        cron.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
                            const lastController = botManager.getLastAdmin();
                            console.log("Sending message for ", cronJob.cron_id);
                            yield sessionManager.endDay(lastController);
                        }), { timezone: cronJob.timezone });
                    }
                    else {
                        if (cronPosts.length !== 0) {
                            cron.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
                                let modifiedDBPost = {
                                    name: "",
                                    id: ""
                                };
                                const cronToPost = cronPosts.find(pst => pst.message_id === cronJob.cron_id);
                                if (cronToPost === null || cronToPost === void 0 ? void 0 : cronToPost.video) {
                                    modifiedDBPost = Object.assign(Object.assign({}, cronToPost), { id: cronToPost.message_id, video: messageVideoDetails });
                                }
                                if (cronToPost === null || cronToPost === void 0 ? void 0 : cronToPost.image) {
                                    modifiedDBPost = Object.assign(Object.assign({}, cronToPost), { id: cronToPost.message_id, image: join(__dirname, '../media/imgs/brand/', `${(cronToPost.message_id.includes("get_ready")) ? this.fileToUse.get_ready : this.fileToUse[cronToPost.message_id]}`) });
                                }
                                if (cronJob.cron_id === "overnight_start" || cronJob.cron_id === "morning_start" || cronJob.cron_id === "afternoon_start") {
                                    const prSesh = sessionManager.getPresentSession();
                                    console.log(`...New session commences: ${prSesh || cronJob.cron_id.split("_")[0].toLocaleUpperCase()} SESSION`);
                                }
                                if (Object.keys(modifiedDBPost).length !== 0) {
                                    console.log("Sending message for ", modifiedDBPost.id);
                                    yield botManager.sendMessageByType(modifiedDBPost, channelId);
                                }
                            }), { timezone: cronJob.timezone });
                        }
                    }
                });
            });
        });
        this.history = [];
        this.dayHistory = {};
        this.fileToUse = {
            gen_info_night: "gen_info_night.jpg",
            gen_info_morning: "gen_info_morning.jpg",
            gen_info_noon: "gen_info_noon.jpg",
            get_ready: "get_ready.jpg",
            session_end: "session_end.jpg"
        };
    }
}
const sessionManager = new Session();
class SignalManager {
    constructor() {
        this.createNewSignal = () => __awaiter(this, void 0, void 0, function* () {
            const padZero = (num) => num.toString().padStart(2, "0");
            const getNextTime = (h, m, increment) => {
                m += increment;
                if (m >= 60) {
                    h += Math.floor(m / 60);
                    m %= 60;
                }
                h %= 24;
                return `${padZero(h)}:${padZero(m)}`;
            };
            const entryTime = `${padZero(this.signal.hour)}:${padZero(this.signal.minute)}`;
            const martingaleLevels = [
                getNextTime(this.signal.hour, this.signal.minute, 5),
                getNextTime(this.signal.hour, this.signal.minute, 10),
                getNextTime(this.signal.hour, this.signal.minute, 15),
            ];
            let SIGNAL_MSG = `<strong>${this.signal.pair}</strong>\n\n`;
            SIGNAL_MSG += `<strong>🕘 Expiration 5M</strong>\n`;
            SIGNAL_MSG += `<strong>⏺ Entry at ${entryTime}</strong>\n\n`;
            SIGNAL_MSG += `<strong>${this.signal.direction}</strong>\n\n`;
            SIGNAL_MSG += `<strong>Telegram: <a href="https://t.me/gudtradewithmatthew">@gudtradewithmatthew</a></strong>\n\n`;
            SIGNAL_MSG += `<strong>🔽 MARTINGALE LEVELS</strong>\n`;
            SIGNAL_MSG += `<strong>1️⃣ LEVEL AT ${martingaleLevels[0]}</strong>\n`;
            SIGNAL_MSG += `<strong>2️⃣ LEVEL AT ${martingaleLevels[1]}</strong>\n`;
            SIGNAL_MSG += `<strong>3️⃣ LEVEL AT ${martingaleLevels[2]}</strong>\n\n`;
            SIGNAL_MSG += `<strong><a href="https://shorturl.at/cehnV">💹 TRADE THIS SIGNAL HERE</a></strong>\n\n`;
            const presentSession = sessionManager.getPresentSession();
            yield db.saveSignal({
                pair: this.signal.pair,
                direction: this.signal.direction,
                result: null,
                initialTime: entryTime
            }, presentSession);
            return SIGNAL_MSG;
        });
        this.getCurrencyPairTextFromCallbackData = (callbackData) => {
            var _a;
            return (((_a = Object.values(this.currencyPairs)
                .flatMap((step) => (Array.isArray(step) ? step : []))
                .flatMap((item) => (Array.isArray(item) ? item : [item]))
                .find((item) => item.callback_data === callbackData)) === null || _a === void 0 ? void 0 : _a.text) || null);
        };
        this.setLastStep = (step) => this.signal.lastStep = step;
        this.setPair = (pair) => this.signal.pair = pair;
        this.setHour = (hour) => this.signal.hour = hour;
        this.setMinute = (minute) => this.signal.minute = minute;
        this.setDirection = (direction) => this.signal.direction = direction;
        this.setAccurateSignalStep = (manualNext) => {
            if (this.signal.lastStep !== null) {
                return this.signal.lastStep;
            }
            else {
                return manualNext;
            }
        };
        this.presentSignal = () => this.signal;
        this.checkSignalObject = (action) => {
            if (action === "post_signal" &&
                typeof this.signal.hour === "number" &&
                typeof this.signal.minute === "number") {
                return true;
            }
            else {
                return false;
            }
        };
        this.lastStep = () => this.signal.lastStep;
        this.step0 = () => this.currencyPairs.step0;
        this.step1 = () => this.currencyPairs.step1;
        this.step2 = () => this.currencyPairs.step2;
        this.step3 = () => this.currencyPairs.step3;
        this.text = () => this.currencyPairs.text;
        this.signal = {
            pair: "",
            hour: 0,
            minute: 0,
            direction: "",
            lastStep: "pairs_0"
        };
        this.currencyPairs = {
            text: "Choose a currency pair\n\nIf it's not here (almost impossible ;)...), choose a closely similar one and edit the post after i send it to the channel.\n\n",
            step0: [
                [
                    { text: "🇦🇪 AED / CNY 🇨🇳 (OTC)", callback_data: "AED/CNY (OTC)" },
                    { text: "🇦🇺 AUD / CAD 🇨🇦 (OTC)", callback_data: "AUD/CAD (OTC)" },
                ],
                [
                    { text: "🇦🇺 AUD / CHF 🇨🇭 (OTC)", callback_data: "AUD/CHF (OTC)" },
                    { text: "🇦🇺 AUD / NZD 🇳🇿 (OTC)", callback_data: "AUD/NZD (OTC)" },
                ],
                [
                    { text: "🇦🇺 AUD / USD 🇺🇸 (OTC)", callback_data: "AUD/USD (OTC)" },
                    { text: "🇧🇭 BHD / CNY 🇨🇳 (OTC)", callback_data: "BHD/CNY (OTC)" },
                ],
                [
                    { text: "🇨🇦 CAD / CHF 🇨🇭 (OTC)", callback_data: "CAD/CHF (OTC)" },
                    { text: "🇨🇦 CAD / JPY 🇯🇵 (OTC)", callback_data: "CAD/JPY (OTC)" },
                ],
                [
                    { text: "🇨🇭 CHF / JPY 🇯🇵 (OTC)", callback_data: "CHF/JPY (OTC)" },
                    { text: "🇨🇭 CHF / NOK 🇳🇴 (OTC)", callback_data: "CHF/NOK (OTC)" },
                ],
                [
                    { text: "🇪🇺 EUR / CHF 🇨🇭 (OTC)", callback_data: "EUR/CHF (OTC)" },
                    { text: "🇪🇺 EUR / GBP 🇬🇧 (OTC)", callback_data: "EUR/GBP (OTC)" },
                ],
                [
                    { text: "🇪🇺 EUR / HUF 🇭🇺 (OTC)", callback_data: "EUR/HUF (OTC)" },
                    { text: "🇪🇺 EUR / JPY 🇯🇵 (OTC)", callback_data: "EUR/JPY (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / MXN 🇲🇽 (OTC)", callback_data: "USD/MXN (OTC)" },
                    { text: "🇺🇸 USD / IDR 🇮🇩 (OTC)", callback_data: "USD/IDR (OTC)" },
                ],
                [{ text: "More Pairs ▶", callback_data: "pairs_1" }],
                [{ text: "Cancel Operation", callback_data: "cancel_op" }],
            ],
            step1: [
                [
                    { text: "🇪🇺 EUR / NZD 🇳🇿 (OTC)", callback_data: "EUR/NZD (OTC)" },
                    { text: "🇪🇺 EUR / RUB 🇷🇺 (OTC)", callback_data: "EUR/RUB (OTC)" },
                ],
                [
                    { text: "🇪🇺 EUR / TRY 🇹🇷 (OTC)", callback_data: "EUR/TRY (OTC)" },
                    { text: "🇪🇺 EUR / USD 🇺🇸 (OTC)", callback_data: "EUR/USD (OTC)" },
                ],
                [
                    { text: "🇬🇧 GBP / AUD 🇦🇺 (OTC)", callback_data: "GBP/AUD (OTC)" },
                    { text: "🇬🇧 GBP / JPY 🇯🇵 (OTC)", callback_data: "GBP/JPY (OTC)" },
                ],
                [
                    { text: "🇬🇧 GBP / USD 🇺🇸 (OTC)", callback_data: "GBP/USD (OTC)" },
                    { text: "🇳🇿 NZD / USD 🇺🇸 (OTC)", callback_data: "NZD/USD (OTC)" },
                ],
                [
                    { text: "🇴🇲 OMR / CNY 🇨🇳 (OTC)", callback_data: "OMR/CNY (OTC)" },
                    { text: "🇸🇦 SAR / CNY 🇨🇳 (OTC)", callback_data: "SAR/CNY (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / ARS 🇦🇷 (OTC)", callback_data: "USD/ARS (OTC)" },
                    { text: "🇺🇸 USD / BDT 🇧🇩 (OTC)", callback_data: "USD/BDT (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / CNH 🇨🇳 (OTC)", callback_data: "USD/CNH (OTC)" },
                    { text: "🇺🇸 USD / EGP 🇪🇬 (OTC)", callback_data: "USD/EGP (OTC)" },
                ],
                [
                    { text: "◀ Back", callback_data: "pairs_0" },
                    { text: "More Pairs ▶", callback_data: "pairs_2" },
                ],
                [{ text: "Cancel Operation", callback_data: "cancel_op_1" }],
            ],
            step2: [
                [
                    { text: "🇺🇸 USD / MYR 🇲🇾 (OTC)", callback_data: "USD/MYR (OTC)" },
                    { text: "🇺🇸 USD / PHP 🇵🇭 (OTC)", callback_data: "USD/PHP (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / RUB 🇷🇺 (OTC)", callback_data: "USD/RUB (OTC)" },
                    { text: "🇺🇸 USD / THB 🇹🇭 (OTC)", callback_data: "USD/THB (OTC)" },
                ],
                [
                    { text: "🇾🇪 YER / USD 🇺🇸 (OTC)", callback_data: "YER/USD (OTC)" },
                    { text: "🇺🇸 USD / CAD 🇨🇦 (OTC)", callback_data: "USD/CAD (OTC)" },
                ],
                [
                    { text: "🇦🇺 AUD / JPY 🇯🇵 (OTC)", callback_data: "AUD/JPY (OTC)" },
                    { text: "🇳🇿 NZD / JPY 🇯🇵 (OTC)", callback_data: "NZD/JPY (OTC)" },
                ],
                [
                    { text: "🇹🇳 TND / USD 🇺🇸 (OTC)", callback_data: "TND/USD (OTC)" },
                    { text: "🇺🇸 USD / SGD 🇸🇬 (OTC)", callback_data: "USD/SGD (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / COP 🇨🇴 (OTC)", callback_data: "USD/COP (OTC)" },
                    { text: "🇲🇦 MAD / USD 🇺🇸 (OTC)", callback_data: "MAD/USD (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / JPY 🇯🇵 (OTC)", callback_data: "USD/JPY (OTC)" },
                    { text: "🇱🇧 LBP / USD 🇺🇸 (OTC)", callback_data: "LBP/USD (OTC)" },
                ],
                [
                    { text: "◀ Back", callback_data: "pairs_1" },
                    { text: "More Pairs ▶", callback_data: "pairs_3" },
                ],
                [{ text: "Cancel Operation", callback_data: "cancel_op" }],
            ],
            step3: [
                [
                    { text: "🇯🇴 JOD / CNY 🇨🇳 (OTC)", callback_data: "JOD/CNY (OTC)" },
                    { text: "🇺🇸 USD / VND 🇻🇳 (OTC)", callback_data: "USD/VND (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / PKR 🇵🇰 (OTC)", callback_data: "USD/PKR (OTC)" },
                    { text: "🇶🇦 QAR / CNY 🇨🇳 (OTC)", callback_data: "QAR/CNY (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / CLP 🇨🇱 (OTC)", callback_data: "USD/CLP (OTC)" },
                    { text: "🇺🇸 USD / INR 🇮🇳 (OTC)", callback_data: "USD/INR (OTC)" },
                ],
                [
                    { text: "🇺🇸 USD / BRL 🇧🇷 (OTC)", callback_data: "USD/BRL (OTC)" },
                    { text: "🇺🇸 USD / CHF 🇨🇭 (OTC)", callback_data: "USD/CHF (OTC)" },
                ],
                [
                    { text: "◀ Back", callback_data: "pairs_2" },
                    { text: "🇺🇸 USD / DZD 🇩🇿 (OTC)", callback_data: "USD/DZD (OTC)" },
                ],
                [{ text: "Cancel Operation", callback_data: "cancel_op" }],
            ],
        };
    }
}
const signalManager = new SignalManager();
class ResultManager {
    constructor() {
        this.callDirect = () => this.directWin;
        this.callMartingale1 = () => this.martingale1;
        this.callMartingale2 = () => this.martingale2;
        this.callMartingale3 = () => this.martingale3;
        this.callLossType1 = () => this.lossType1;
        this.callLossType2 = () => this.lossType2;
        this.callLossType2Image = (fileId) => __awaiter(this, void 0, void 0, function* () {
            try {
                const watermarkPath = `https://lh3.googleusercontent.com/pw/AP1GczPt3db3v4XAjMGyZIo94YUcG0Oqa4Shvq8SmBpheJ3Qz3Tk9BzQAhm-HC6kwQWQhy85PW9kPPGGkJAaYB7hn1kKP0SQ_sStZCNokOrMspgBWZetkBuwkNAFKHhMZD_GW43Edc771MVyDOYfAP9Com83QJFx6-xVRiHcNg-cQ7EkRXAZ2cKPaJzdeytdYB0GQO3UfHkEjbnK_CMOm_Cef0oqadY_8wgJYBKO5Ia_WCqcfT5oM2GlTrVyhx2ed6_FrBwi_BY9tihd8su0FnE7gNE6ceUr3vYd9w1jeZziPmHkPfa_xPbwr_WzqJmwNJDljyDRaBPlZYDiaUxuW0_KP5dETGtR_6LlqFF-3LB-axuq4GpbJaaUgDEn9MVaX207va7hN0xqHlBa7TYIaGEc0fANi38BR3DKdqLqFdWqPpUe6foiLNp8ON5Ib1yegjtfGW9s_-2kr_VtvPCLNHIMb_CHuHgfeOT8iBckYr_Hkg6aLu8R11eBgIyznxVLxidOR_ffs4bVB2u0XwOucs4eoFWIVvVcbkBQs-mE2RIggXyg8OBLFoNS-rGR3E8l8U5vLR3nlxrAU-ziH7GWO_wyWNB99UhoT7pfzxcpvfvyuCMrHrqnJ_mGsCaGFYxguUIDoTMyRWNQNPVXIi1Vg2HiP30ikiVWOLTiYxuJs3DRVGbxCJw87CwsDd685hTNAgdkSl3WrxM2me_NDW3Fke_aSZJNlRLCC728aljTp-iKSz_JuuP3-gKnzqluNVPLt7fmKhZXGC6ul7TiroUYLAuMr898F6kyz53BYlVp4va0WljphF7QNE_BSUJk8JyGMAfQnKNb3wlMiOm17lUYEh_V0-xe8xko5Y8ov3ozarTVgT4V5-BrDPQD1GxLwnvisc9LxnGAP5id5utAzsq9K3I3lv-yx8S6XXM1XQD-897VKwUPhVKJogmlIUmJwphN9oocdxAET8WWmUDitwtJoA=w691-h590-no?authuser=0`;
                const resultTgImageUrl = yield sessionManager.downloadAndSavePhoto(fileId).catch((err) => {
                    console.error(err);
                    return null;
                });
                if (resultTgImageUrl !== null) {
                    const quickChartLink = `https://quickchart.io/watermark?mainImageUrl=${resultTgImageUrl}&markImageUrl=${watermarkPath}&markRatio=0.6&position=center&opacity=0.65`;
                    const watermarkImage = yield sessionManager.downloadMarkedPhoto(quickChartLink).then(result => {
                        console.log('Download Status:', result.status);
                        console.log('Saved as:', result.filename);
                        return result.filePath;
                    });
                    return watermarkImage;
                }
            }
            catch (error) {
                console.error("Error adding watermark:", error);
            }
            return null;
        });
        this.directWin = "✅ WIN⁰ ✅ - Direct WIN 🏆👏";
        this.martingale1 = "✅ WIN¹ ✅ - Victory in Martingale 1 🫵";
        this.martingale2 = "✅ WIN² ✅ - Victory in Martingale 2 🫵";
        this.martingale3 = "✅ WIN³ ✅ - Victory in Martingale 3 🫵";
        this.lossType1 = "❌";
        this.lossType2 = "❌";
    }
}
const resultManager = new ResultManager();
class ClimaxPostCreation {
    constructor() {
        this.setPostText = (value) => {
            this.POST.text = value;
            // this.setState("awaitingPostText", false);
        };
        this.setPostPhoto = (value) => {
            this.POST.image = value;
            // this.setState("awaitingPostPhoto", false);
        };
        this.setPostVideo = (width, height, path) => {
            this.POST.video = { width, height, path };
            // this.setState("awaitingPostVideo", false);
        };
        this.setPostEntites = (messageEntity) => {
            this.POST.entities = messageEntity;
        };
        this.setPostreply_markup = (inlineMarkup) => {
            this.POST.reply_markup = {
                inline_keyboard: inlineMarkup,
            };
        };
        this.setState = (key, value) => {
            if (typeof value === "boolean") {
                if (key === "awaitingPostText") {
                    this.STATE.awaitingPostText = value;
                }
                if (key === "awaitingPostPhoto") {
                    this.STATE.awaitingPostPhoto = value;
                }
                if (key === "awaitingPostVideo") {
                    this.STATE.awaitingPostVideo = value;
                }
                if (key === "awaitingResultImage") {
                    this.STATE.awaitingResultImage = value;
                }
                if (key === "chosenSignalResult") {
                    this.STATE.chosenSignalResult = value;
                }
            }
            if (typeof value === "string" && key === "presentSignalResult") {
                this.STATE.presentSignalResult = value;
            }
            if (typeof value === "string" && key === "resultImagePath") {
                this.STATE.resultImagePath = value;
            }
            if (typeof value === "number" && key === "lastPreviewMessageId") {
                this.STATE.lastPreviewMessageId = value;
            }
        };
        this.correspondingResponse = () => {
            const corRes = {
                name: "",
                id: "",
                text: "What you're seeing above is a preview of your message (presently).\n\n<strong>Note: <i>When you start to create buttons, you CAN NOT remove the text, video or image anymore..</i></strong>\n\nWhat would you like to do next?",
            };
            if (this.STATE.awaitingPostText) {
                corRes.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📝 Remove Text", callback_data: "post_remove_text" },
                            { text: "🖼 Add Photo", callback_data: "post_add_photo" },
                        ],
                        [
                            { text: "📹 Send Video", callback_data: "post_add_video" },
                            { text: "Add a Button", callback_data: "post_add_btn" },
                        ],
                        [{ text: "Cancel Operation", callback_data: "cancel_op" }],
                    ],
                };
                this.STATE.awaitingPostText = false;
            }
            if (this.STATE.awaitingPostPhoto && this.POST.text === "") {
                corRes.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📝 Send Text", callback_data: "post_add_text" },
                            { text: "🖼 Remove Photo", callback_data: "post_remove_photo" },
                        ],
                        [{ text: "Add a Button", callback_data: "post_add_btn" }],
                        [{ text: "Cancel Operation", callback_data: "cancel_op" }],
                    ],
                };
                this.STATE.awaitingPostPhoto = false;
            }
            if (this.STATE.awaitingPostPhoto && this.POST.text !== "") {
                corRes.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📝 Remove Text", callback_data: "post_add_text" },
                            { text: "🖼 Remove Photo", callback_data: "post_remove_photo" },
                        ],
                        [{ text: "Add a Button", callback_data: "post_add_btn" }],
                        [{ text: "Cancel Operation", callback_data: "cancel_op" }],
                    ],
                };
                this.STATE.awaitingPostPhoto = false;
            }
            if (this.STATE.awaitingPostVideo && this.POST.text === "") {
                corRes.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📝 Add Text", callback_data: "post_add_text" },
                            { text: "📹 Remove Video", callback_data: "post_remove_video" },
                        ],
                        [{ text: "Add a Button", callback_data: "post_add_btn" }],
                        [{ text: "Cancel Operation", callback_data: "cancel_op" }],
                    ],
                };
                this.STATE.awaitingPostVideo = false;
            }
            if (this.STATE.awaitingPostVideo && this.POST.text !== "") {
                corRes.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📝 Remove Text", callback_data: "post_remove_text" },
                            { text: "📹 Remove Video", callback_data: "post_remove_video" },
                        ],
                        [{ text: "Add a Button", callback_data: "post_add_btn" }],
                        [{ text: "Cancel Operation", callback_data: "cancel_op" }],
                    ],
                };
                this.STATE.awaitingPostVideo = false;
            }
            return corRes;
        };
        this.awaitingPostText = () => this.STATE.awaitingPostText;
        this.awaitingPostPhoto = () => this.STATE.awaitingPostPhoto;
        this.awaitingPostVideo = () => this.STATE.awaitingPostVideo;
        this.awaitingResultImage = () => this.STATE.awaitingResultImage;
        this.chosenSignalResult = () => this.STATE.chosenSignalResult;
        this.presentSignalResult = () => this.STATE.presentSignalResult;
        this.resultImagePath = () => this.STATE.resultImagePath;
        this.lastPreviewMessageId = () => this.STATE.lastPreviewMessageId;
        this.presentPostData = () => this.POST;
        this.STATE = {
            awaitingPostText: false,
            awaitingPostPhoto: false,
            awaitingPostVideo: false,
            awaitingResultImage: false,
            chosenSignalResult: false,
            presentSignalResult: "",
            resultImagePath: "",
            lastPreviewMessageId: 0,
        };
        this.POST = {
            id: "",
            name: "",
            text: "",
        };
    }
}
const climaxPostOnCreation = new ClimaxPostCreation();
class BotManager {
    constructor() {
        this.lastBotMessageId = (chatId) => this.CONVERSATIONS[chatId].lastBotMessageId;
        this.setLastAdmin = (chatId) => {
            this.lastAdmin = chatId;
        };
        this.setLastBotMessageId = (chatId, messageId) => {
            this.CONVERSATIONS[chatId].lastBotMessageId = messageId;
        };
        this.getLastAdmin = () => this.lastAdmin;
        this.getPresentSession = () => this.presentSession;
        this.sendToChannel = (text, chatId, messageOption = undefined, successMessage, type = "text") => {
            if (type === "text") {
                if (messageOption === undefined) {
                    bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
                        .then(() => {
                        bot.sendMessage(channelId, text)
                            .then(() => {
                            bot.sendMessage(chatId, successMessage);
                        });
                    });
                }
                else {
                    bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
                        .then(() => {
                        bot.sendMessage(channelId, text, messageOption)
                            .then(() => {
                            bot.sendMessage(chatId, successMessage);
                        });
                    });
                }
            }
            climaxPostOnCreation.setState("resultImagePath", "");
            climaxPostOnCreation.setState("awaitingResultImage", false);
        };
        this.deleteAndSendNewMessage = (newText, messageId, recipient, newKeyboard = undefined) => {
            if (this.CONVERSATIONS[recipient].lastBotMessageId !== undefined && messageId !== undefined) {
                bot.deleteMessage(recipient, this.CONVERSATIONS[recipient].lastBotMessageId || messageId)
                    .then(() => {
                    if (newKeyboard !== undefined) {
                        bot.sendMessage(recipient, newText, {
                            parse_mode: "HTML",
                            reply_markup: { inline_keyboard: newKeyboard }
                        })
                            .then((sentMessage) => {
                            this.CONVERSATIONS[recipient].lastBotMessageId = sentMessage.message_id;
                        })
                            .catch((error) => {
                            console.error("Error deleting message: ", error);
                        });
                    }
                    else {
                        bot.sendMessage(recipient, newText, {
                            parse_mode: "HTML"
                        })
                            .then((sentMessage) => {
                            this.CONVERSATIONS[recipient].lastBotMessageId = sentMessage.message_id;
                        })
                            .catch((error) => {
                            console.error("Error deleting message: ", error);
                        });
                    }
                });
            }
        };
        this.sendMessage = (chatId, text, messageOptions) => {
            if (messageOptions === undefined) {
                return bot.sendMessage(chatId, text)
                    .then((sentMessage) => {
                    this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
                    return sentMessage;
                });
            }
            else {
                return bot.sendMessage(chatId, text, messageOptions)
                    .then((sentMessage) => {
                    this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
                    return sentMessage;
                });
            }
        };
        this.sendPhoto = (chatId, text, photoOptions) => {
            if (photoOptions === undefined) {
                return bot.sendMessage(chatId, text)
                    .then((sentMessage) => {
                    this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
                    return sentMessage;
                });
            }
            else {
                return bot.sendMessage(chatId, text, photoOptions)
                    .then((sentMessage) => {
                    this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
                    return sentMessage;
                });
            }
        };
        this.sendMessageByType = (msgObject, chatId) => __awaiter(this, void 0, void 0, function* () {
            try {
                let messageOptions = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                };
                if ("reply_markup" in msgObject) {
                    messageOptions = Object.assign(Object.assign({}, messageOptions), { reply_markup: msgObject.reply_markup });
                }
                if ("video" in msgObject && msgObject.video !== undefined && msgObject.video !== false && msgObject.video !== true) {
                    const videoFilePath = join(__dirname, "../media/videos", messageVideoDetails.path);
                    const videoStream = createReadStream(videoFilePath);
                    if ("text" in msgObject) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption: msgObject.text });
                    }
                    if ("entities" in msgObject) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption_entities: msgObject.entities });
                    }
                    messageOptions = Object.assign(Object.assign({}, messageOptions), { width: msgObject.video.width, height: msgObject.video.height });
                    yield bot.sendVideo(chatId, videoStream, messageOptions, {
                        contentType: "application/octet-stream"
                    }).then((sentMessage) => {
                        if (chatId === TWM_ADMIN || chatId === INCENIX) {
                            climaxPostOnCreation.setState("lastPreviewMessageId", sentMessage.message_id);
                        }
                    }).catch((error) => {
                        console.log("Error sending message on msgObject type: ", error);
                        return false;
                    });
                    return true;
                }
                if ("image" in msgObject && msgObject.image !== undefined && msgObject.image !== false && msgObject.image !== true) {
                    // send photo message
                    const imageStream = createReadStream(msgObject.image);
                    if ("text" in msgObject) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption: msgObject.text });
                    }
                    if ("entities" in msgObject) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption_entities: msgObject.entities });
                    }
                    yield bot.sendPhoto(chatId, imageStream, messageOptions, {
                        contentType: "application/octet-stream"
                    }).then((sentMessage) => {
                        if (chatId === TWM_ADMIN || chatId === INCENIX) {
                            climaxPostOnCreation.setState("lastPreviewMessageId", sentMessage.message_id);
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                    return true;
                }
                if (msgObject.text !== undefined) {
                    if ("entities" in msgObject) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { entities: msgObject.entities });
                    }
                    bot.sendMessage(chatId, msgObject.text, messageOptions)
                        .then((sentMessage) => {
                        if (chatId === TWM_ADMIN || chatId === INCENIX) {
                            climaxPostOnCreation.setState("lastPreviewMessageId", sentMessage.message_id);
                        }
                    }).catch((error) => {
                        console.log("Error sending message on msgObject type: ", error);
                        return false;
                    });
                    return true;
                }
            }
            catch (error) {
                console.error(error);
                return false;
            }
            return true;
        });
        this.lastAdmin = 0;
        // this.lastAdmin = INCENIX as ChatId;
        this.presentSession = "";
        this.CONVERSATIONS = {
            [TWM_ADMIN]: {
                lastBotMessageId: 0,
                lastPreviewId: 0
            },
            [INCENIX]: {
                lastBotMessageId: 0,
                lastPreviewId: 0
            }
        };
    }
}
const botManager = new BotManager();
bot.onText(/\/start/, (msg) => {
    var _a, _b;
    const chatId = (_a = msg === null || msg === void 0 ? void 0 : msg.from) === null || _a === void 0 ? void 0 : _a.id;
    const firstName = (_b = msg === null || msg === void 0 ? void 0 : msg.from) === null || _b === void 0 ? void 0 : _b.first_name;
    const authorized = authorize(chatId);
    if (authorized) {
        let START_MSG = `<strong>Hello, ${firstName}!</strong>\n\n`;
        START_MSG += `I'm <strong>Halskey</strong>, your channel bot! 📈🚀\n`;
        START_MSG += `I can help you with:\n\n`;
        START_MSG += `<strong>- 📡 Posting signals (i auto-calculate the martingales)</strong>\n`;
        START_MSG += `<strong>- 📡 Ending a trading session</strong>\n`;
        START_MSG += `<strong>- 📅 Scheduling posts to be published on your channel</strong>\n`;
        START_MSG += `<strong>- 📝 Creating posts with buttons (one or multiple)</strong>\n\n`;
        START_MSG += `<strong>There's a new menu button on your telegram input field, you can find my commands there :)</strong>\n`;
        bot.sendMessage(chatId, START_MSG, { parse_mode: "HTML" });
    }
    else {
        bot.sendMessage(chatId, "You are not authorized to use this bot");
    }
});
bot.onText(/\/signal/, (msg) => {
    var _a;
    const chatId = (_a = msg === null || msg === void 0 ? void 0 : msg.from) === null || _a === void 0 ? void 0 : _a.id;
    const authorized = authorize(chatId);
    if (authorized) {
        const pairText = signalManager.text();
        const pairsKeyboard = signalManager.step0();
        bot.sendMessage(chatId, pairText, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: pairsKeyboard
            },
        })
            .then((sentMessage) => {
            botManager.setLastBotMessageId(chatId, sentMessage.message_id);
        });
    }
    else {
        bot.sendMessage(chatId, "You are not authorized to use this bot");
    }
});
const pairRegex = /[A-Z]{3}\/[A-Z]{3} \(OTC\)/;
const hourRegex = /.*hour_.*/;
const minuteRegex = /.*minute_.*/;
const winRegex = /.*martingale.*/;
bot.onText(/\/result/, (msg) => {
    var _a;
    const chatId = (_a = msg === null || msg === void 0 ? void 0 : msg.from) === null || _a === void 0 ? void 0 : _a.id;
    const authorized = authorize(chatId);
    if (authorized) {
        const RESULT = {
            martingale0: "✅ WIN⁰ ✅ - Direct WIN 🏆👏",
            martingale1: "✅ WIN¹ ✅ - Victory in Martingale 1 ☝",
            martingale2: "✅ WIN² ✅ - Victory in Martingale 2 ☝",
            martingale3: "✅ WIN³ ✅ - Victory in Martingale 3 ☝",
            lossBoth: "LOSS ❌"
        };
        const POST_RESULT_MSG_1 = "Choose one of the options below:";
        const keyboard = Object.entries(RESULT).map(([key, value]) => ([{
                text: value,
                callback_data: key
            }]));
        keyboard.push([{ text: "Cancel Operation", callback_data: "cancel_op" }]);
        bot.sendMessage(chatId, POST_RESULT_MSG_1, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            },
        }).then((sentMessage) => {
            botManager.setLastBotMessageId(chatId, sentMessage.message_id);
        });
    }
    else {
        bot.sendMessage(chatId, "You are not authorized to use this bot");
    }
});
bot.on("callback_query", (callbackQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const msg = callbackQuery.message;
    const chatId = msg === null || msg === void 0 ? void 0 : msg.chat.id;
    const messageId = msg === null || msg === void 0 ? void 0 : msg.message_id;
    const action = callbackQuery.data;
    const authorized = authorize(chatId);
    if (authorized) {
        if (action === undefined) {
            console.error("CallBackQuery action is undefined");
            return;
        }
        if ((action === "cancel_op" || action === "cancel_buttonpost") && messageId !== undefined) {
            const CSR = climaxPostOnCreation.chosenSignalResult();
            const lastHalskeyMessageId = botManager.lastBotMessageId(chatId);
            if (CSR === true) {
                climaxPostOnCreation.setState("chosenSignalResult", false);
            }
            bot.deleteMessage(chatId, lastHalskeyMessageId || messageId)
                .then(() => {
                bot.sendMessage(chatId, "Operation Canceled");
            });
        }
        // callback quering for signals
        if (action === "pairs_0") {
            const currencyText = signalManager.text();
            const pairsKeyboard = signalManager.step0();
            botManager.deleteAndSendNewMessage(currencyText, messageId, chatId, pairsKeyboard);
            signalManager.setLastStep("pairs_0");
        }
        if (action === "pairs_1") {
            const currencyText = signalManager.text();
            const pairsKeyboard = signalManager.step1();
            botManager.deleteAndSendNewMessage(currencyText, messageId, chatId, pairsKeyboard);
            signalManager.setLastStep("pairs_1");
        }
        if (action === "pairs_2") {
            const currencyText = signalManager.text();
            const pairsKeyboard = signalManager.step2();
            botManager.deleteAndSendNewMessage(currencyText, messageId, chatId, pairsKeyboard);
            signalManager.setLastStep("pairs_2");
        }
        if (action === "pairs_3") {
            const currencyText = signalManager.text();
            const pairsKeyboard = signalManager.step3();
            botManager.deleteAndSendNewMessage(currencyText, messageId, chatId, pairsKeyboard);
            signalManager.setLastStep("pairs_3");
        }
        if (pairRegex.test(action) || action === "restep_time") {
            let text = "🕓 What time (HOUR) would you like to start?\n\n0 is the same as 24 or 12am midnight...";
            if (pairRegex.test(action)) {
                if (action !== "SSS/TTT (OTC)") {
                    const pairWithFlags = signalManager.getCurrencyPairTextFromCallbackData(action);
                    signalManager.setPair(pairWithFlags);
                }
            }
            const hours = Array.from({ length: 24 }, (_, i) => ({
                text: i.toString(),
                callback_data: `hour_${i}`,
            }));
            const keyboard = [];
            for (let i = 0; i < hours.length; i += 6) {
                keyboard.push(hours.slice(i, i + 6));
            }
            keyboard.push([{ text: "◀ Back", callback_data: signalManager.setAccurateSignalStep("pairs_0") }]);
            botManager.deleteAndSendNewMessage(text, messageId, chatId, keyboard);
        }
        if (hourRegex.test(action)) {
            let text = "🕓 What time (MINUTE) would you like to start?\n\nthe back button is on the last row instead of 60";
            signalManager.setHour(Number(action.replace(/^hour_/, "")));
            ;
            const minute = Array.from({ length: 12 }, (_, i) => ({
                text: (i * 5).toString(),
                callback_data: `minute_${i * 5}`,
            }));
            const keyboard = [];
            for (let i = 0; i < minute.length; i += 6) {
                keyboard.push(minute.slice(i, i + 6));
            }
            keyboard.push([{ text: "◀", callback_data: "SSS/TTT (OTC)" }]);
            botManager.deleteAndSendNewMessage(text, messageId, chatId, keyboard);
        }
        if (minuteRegex.test(action) || action === "restep_direction") {
            signalManager.setMinute(Number(action.replace(/^minute_/, "")));
            let text = "↕ What direction would you like to go?\nChoose an option below:";
            const keyboard = [
                [
                    { text: "🟩 BUY", callback_data: "direction_up" },
                    { text: "🟥 SELL ", callback_data: "direction_down" }
                ],
                [{ text: "◀ Back", callback_data: "hour_0" }],
            ];
            botManager.deleteAndSendNewMessage(text, messageId, chatId, keyboard);
        }
        if (action === "direction_up" || action === "direction_down") {
            signalManager.setDirection((action === "direction_up") ? "🟩 BUY" : "🟥 SELL");
            signalManager.setLastStep(action);
            const SIGNAL = signalManager.presentSignal();
            let text = "Okay let's review what you've chosen:\n\n";
            text += `Currency Pair: ${SIGNAL.pair} \n`;
            text += `Start Time: ${SIGNAL.hour}:${SIGNAL.minute} \n`;
            text += `Direction: ${SIGNAL.direction} \n\n`;
            text += `<blockquote><strong>Note: i will post the signal immediately you click on correct ✅</strong></blockquote>`;
            const keyboard = [
                [{ text: "Correct ✅", callback_data: "post_signal" }],
                [
                    { text: "◀ Pairs", callback_data: "restep_pairs" },
                    { text: "◀ Time", callback_data: "restep_time" },
                    { text: "◀ Direction", callback_data: "restep_direction" },
                ],
            ];
            botManager.deleteAndSendNewMessage(text, messageId, chatId, keyboard);
        }
        if (signalManager.checkSignalObject(action) &&
            channelId !== undefined) {
            const message = yield signalManager.createNewSignal();
            botManager.sendToChannel(message, chatId, {
                parse_mode: "HTML",
                disable_web_page_preview: true
            }, "Signal posted successfully.");
            signalManager.setLastStep("pairs_0");
        }
        // POSTING RESULTS
        if (action === "result_image") {
            climaxPostOnCreation.setState("awaitingResultImage", true);
            climaxPostOnCreation.setState("resultImagePath", "");
            const RESULT_IMAGE_TXT = "Send me the image of your win/loss.";
            botManager.deleteAndSendNewMessage(RESULT_IMAGE_TXT, messageId, chatId);
        }
        if (winRegex.test(action) || action === "lossBoth") {
            if (action === "martingale0") {
                db.updateSignal(resultManager.callDirect());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callDirect());
            }
            if (action === "martingale1") {
                db.updateSignal(resultManager.callMartingale1());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale1());
            }
            if (action === "martingale2") {
                db.updateSignal(resultManager.callMartingale2());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale2());
            }
            if (action === "martingale3") {
                db.updateSignal(resultManager.callMartingale3());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale3());
            }
            if (action === "lossBoth") {
                db.updateSignal("❌ LOSS");
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callLossType1());
            }
            climaxPostOnCreation.setState("chosenSignalResult", true);
            const PSR = climaxPostOnCreation.presentSignalResult();
            const RESULT_TXT = `This is what you have chosen:\n<blockquote>${PSR}</blockquote>\n\nWhat would you like to do next?`;
            const keyboard = [
                [{ text: "🖼 Add Image", callback_data: "result_image" }],
                [{ text: "⏫ Just Send", callback_data: "send_result" }],
                [{ text: "Cancel Operation", callback_data: "cancel_op" }]
            ];
            botManager.deleteAndSendNewMessage(RESULT_TXT, messageId, chatId, keyboard);
        }
        if (action === "send_result") {
            const ARI = climaxPostOnCreation.awaitingResultImage();
            if (ARI) {
                console.log("About to send result with image...");
                const resultType = climaxPostOnCreation.presentSignalResult();
                const resultTypeDefined = resultType === resultManager.callLossType1() ? resultManager.callLossType2() : climaxPostOnCreation.presentSignalResult();
                const resultImage = climaxPostOnCreation.resultImagePath();
                const resultImageStream = createReadStream(resultImage);
                bot.deleteMessage(chatId, botManager.lastBotMessageId(chatId)).then(() => {
                    if (resultImage !== undefined) {
                        bot.sendPhoto(channelId, resultImageStream, {
                            caption: resultTypeDefined
                        }).then(() => bot.sendMessage(chatId, "Result posted successfully..."));
                    }
                });
            }
            else {
                const PSR = climaxPostOnCreation.presentSignalResult();
                if (PSR === resultManager.callLossType1()) {
                    botManager.sendToChannel("❌", chatId, undefined, "Result Sent Successfully.");
                    return;
                }
                botManager.sendToChannel(PSR, chatId, {
                    parse_mode: "HTML"
                }, "Result posted successfully...");
            }
            botManager.setLastAdmin(chatId);
        }
    }
    else {
        bot.sendMessage(chatId, "You are not authorized to use this bot");
    }
}));
// PHOTO LISTENERS AND LOGIC
bot.on("photo", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = message === null || message === void 0 ? void 0 : message.chat.id;
    const messageId = message === null || message === void 0 ? void 0 : message.message_id;
    const fileId = ((_a = message === null || message === void 0 ? void 0 : message.photo) === null || _a === void 0 ? void 0 : _a[message.photo.length - 1].file_id) || undefined;
    const authorized = authorize(chatId);
    if (authorized) {
        //photo listener and operations
        const ARI = climaxPostOnCreation.awaitingResultImage();
        if (ARI) {
            const resultImageWIthWatermark = yield resultManager.callLossType2Image(fileId);
            if (resultImageWIthWatermark !== null) {
                const keyboard = [
                    [{ text: "⏫ Send to Channel", callback_data: "send_result" }],
                    [{ text: "Cancel Operation", callback_data: "cancel_op" }]
                ];
                climaxPostOnCreation.setState("resultImagePath", resultImageWIthWatermark);
                botManager.deleteAndSendNewMessage("Photo received and saved, what to do next?:", messageId, chatId, keyboard);
            }
            else {
                bot.sendMessage(chatId, "Sorry, I couldn't download the picture and save");
            }
        }
    }
    else {
        bot.sendMessage(chatId, "You are not authorized to use this bot");
    }
}));
bot.onText(/\/endsession/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
    yield sessionManager.endSession(chatId, true);
}));
bot.onText(/\/endday/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
    sessionManager.endDay(chatId);
}));
bot.onText(/\/reportweek/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
    let messageId = 0;
    yield bot.sendMessage(chatId, "Please wait...")
        .then(sentMsg => {
        messageId = sentMsg.message_id;
    });
    const weekReportText = yield sessionManager.analysePastWeek();
    yield bot.sendMessage(channelId, weekReportText, {
        parse_mode: "HTML"
    })
        .then(sentMsg => {
        bot.editMessageText("Weekly report sent successfully", {
            chat_id: chatId,
            message_id: messageId
        });
    });
}));
sessionManager.scheduleClimaxCrons();
app.get("/", (req, res) => {
    res.send("Halskey v2.4.0 for TWM is running...");
});
app.listen(port, () => {
    console.log("Halskey v2.4.0 for TWM is running...");
});
