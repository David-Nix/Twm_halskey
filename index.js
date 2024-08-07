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
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cron from "node-cron";
import { readFileSync, createReadStream } from "fs";
import dotenv from "dotenv";
dotenv.config();
process.env["NTBA_FIX_350"] = "1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3000;
// app.use("/media/imgs", express.static(join(__dirname, "./media/imgs")));
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
const T_W_M = Number(process.env.CHANNEL);
const atomix = Number(process.env.ATOMIX);
const authorize = (chatId) => {
    if (chatId === INCENIX || chatId === TWM_ADMIN) {
        return true;
    }
    else {
        return false;
    }
};
const DATABASE = {
    POSTS: join(__dirname, "./database/posts.json"),
    HISTORY: join(__dirname, "./database/history.json"),
    CRONS: join(__dirname, "./database/crons.json"),
};
const downloadAndSavePhoto = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let fileRelativePath = undefined;
    let fileUrl = "";
    if (fileId !== undefined) {
        const filetoGet = yield bot.getFile(fileId);
        const fileName = (_a = filetoGet.file_path) === null || _a === void 0 ? void 0 : _a.replace("photos/", "").trim();
        fileUrl = `https://api.telegram.org/file/bot${token}/${filetoGet.file_path}`;
        const downloadPath = join(__dirname, "./media/imgs");
        fileRelativePath =
            fileName !== undefined
                ? join(__dirname, "./media/imgs/", fileName)
                : undefined;
        try {
            yield bot.downloadFile(fileId, downloadPath);
            console.log("Photo downloaded successfully...");
        }
        catch (err) {
            console.log("Error downloading photo");
            fileRelativePath = undefined;
        }
    }
    else {
        console.log("No photo found ...or photo has no file_id");
    }
    return { fileRelativePath, fileUrl };
});
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
class ClimaxSignal {
    constructor() {
        this.createNewSignal = () => {
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
            const entryTime = `${padZero(this.Signal.hour)}:${padZero(this.Signal.minute)}`;
            const martingaleLevels = [
                getNextTime(this.Signal.hour, this.Signal.minute, 5),
                getNextTime(this.Signal.hour, this.Signal.minute, 10),
                getNextTime(this.Signal.hour, this.Signal.minute, 15),
            ];
            let SIGNAL_MSG = `<strong>${this.Signal.pair}</strong>\n\n`;
            SIGNAL_MSG += `<strong>🕘 Expiration 5M</strong>\n`;
            SIGNAL_MSG += `<strong>⏺ Entry at ${entryTime}</strong>\n\n`;
            SIGNAL_MSG += `<strong>${this.Signal.direction}</strong>\n\n`;
            SIGNAL_MSG += `<strong>Telegram: <a href="https://t.me/gudtradewithmatthew">@gudtradewithmatthew</a></strong>\n\n`;
            SIGNAL_MSG += `<strong>🔽 MARTINGALE LEVELS</strong>\n`;
            SIGNAL_MSG += `<strong>1️⃣ LEVEL AT ${martingaleLevels[0]}</strong>\n`;
            SIGNAL_MSG += `<strong>2️⃣ LEVEL AT ${martingaleLevels[1]}</strong>\n`;
            SIGNAL_MSG += `<strong>3️⃣ LEVEL AT ${martingaleLevels[2]}</strong>\n\n`;
            SIGNAL_MSG += `<strong><a href="https://shorturl.at/cehnV">💹 TRADE THIS SIGNAL HERE</a></strong>\n\n`;
            const timeAndDateSTamp = new Date().toISOString();
            this.History.push({
                dateStamp: timeAndDateSTamp,
                pair: this.Signal.pair,
                direction: this.Signal.direction,
                result: null
            });
            return SIGNAL_MSG;
        };
        this.getCurrencyPairTextFromCallbackData = (callbackData) => {
            var _a;
            return (((_a = Object.values(this.CurrencyPairs)
                .flatMap((step) => (Array.isArray(step) ? step : []))
                .flatMap((item) => (Array.isArray(item) ? item : [item]))
                .find((item) => item.callback_data === callbackData)) === null || _a === void 0 ? void 0 : _a.text) || null);
        };
        this.clearHistory = () => {
            this.History = [];
        };
        this.getHistory = () => this.History;
        this.setSignalResult = (resultString) => this.History[this.History.length - 1].result = resultString;
        this.setLastStep = (step) => this.Signal.lastStep = step;
        this.setPair = (pair) => this.Signal.pair = pair;
        this.setHour = (hour) => this.Signal.hour = hour;
        this.setMinute = (minute) => this.Signal.minute = minute;
        this.setDirection = (direction) => this.Signal.direction = direction;
        this.setAccurateSignalStep = (manualNext) => {
            if (this.Signal.lastStep !== null) {
                return this.Signal.lastStep;
            }
            else {
                return manualNext;
            }
        };
        this.presentSignal = () => this.Signal;
        this.checkSignalObject = (action) => {
            if (action === "post_signal" &&
                typeof this.Signal.hour === "number" &&
                typeof this.Signal.minute === "number") {
                return true;
            }
            else {
                return false;
            }
        };
        this.checkSessionValidity = () => {
            if (this.History[this.History.length - 1].result === null) {
                return false;
            }
            else if (this.History.length === 0) {
                return null;
            }
            else {
                return true;
            }
        };
        this.lastStep = () => this.Signal.lastStep;
        this.step0 = () => this.CurrencyPairs.step0;
        this.step1 = () => this.CurrencyPairs.step1;
        this.step2 = () => this.CurrencyPairs.step2;
        this.step3 = () => this.CurrencyPairs.step3;
        this.text = () => this.CurrencyPairs.text;
        this.Signal = {
            pair: "",
            hour: 0,
            minute: 0,
            direction: "",
            lastStep: "pairs_0"
        };
        this.History = [
            {
                dateStamp: "",
                pair: "🇺🇸 USD / BRL 🇧🇷 (OTC)",
                direction: "🟩 HIGHER",
                result: ""
            }
        ];
        this.CurrencyPairs = {
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
const signalManager = new ClimaxSignal();
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
                const mainPhotoPath = yield downloadAndSavePhoto(fileId);
                const quickChartLink = `https://quickchart.io/watermark?mainImageUrl=${mainPhotoPath.fileUrl}&markImageUrl=${watermarkPath}&markRatio=0.7&position=center&opacity=1`;
                return quickChartLink;
            }
            catch (error) {
                console.error("Error adding watermark:", error);
            }
        });
        this.directWin = "WIN⁰ ✅ - Direct WIN 🏆👏";
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
        this.setPostReplyMarkup = (inlineMarkup) => {
            this.POST.replyMarkup = {
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
                corRes.replyMarkup = {
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
                corRes.replyMarkup = {
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
                corRes.replyMarkup = {
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
                corRes.replyMarkup = {
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
                corRes.replyMarkup = {
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
class ClimaxManager {
    constructor() {
        this.lastBotMessageId = (chatId) => this.CONVERSATIONS[chatId].lastBotMessageId;
        this.setLastAdmin = (chatId) => {
            this.lastAdmin = chatId;
        };
        this.setLastBotMessageId = (chatId, messageId) => {
            this.CONVERSATIONS[chatId].lastBotMessageId = messageId;
        };
        this.setPresentSession = (sessionName) => {
            this.presentSession = sessionName;
        };
        this.getLastAdmin = () => this.lastAdmin;
        this.getPresentSession = () => this.presentSession;
        this.getMessageFromBank = (findObject) => {
            const rawMessageBankData = readFileSync(DATABASE.POSTS, 'utf-8');
            const messageBankData = JSON.parse(rawMessageBankData);
            const messageObject = messageBankData.find((dataObject) => Object.keys(findObject).every(key => dataObject[key] === findObject[key]));
            return messageObject;
        };
        this.sendSessionEndMessage = (signalHistory, sessionName) => {
            const sessionEndPhotoPath = join(__dirname, "./media/imgs/brand/session_end.jpg");
            const sessionEndPhotoStream = createReadStream(sessionEndPhotoPath);
            const countWinsAndLosses = (history) => {
                return history.reduce((acc, entry) => ({
                    wins: acc.wins + (entry.result.includes("WIN") ? 1 : 0),
                    losses: acc.losses + (!(entry.result.includes("WIN")) ? 1 : 0),
                }), { wins: 0, losses: 0 });
            };
            const sessionResult = countWinsAndLosses(signalHistory);
            let sessionIcon = "";
            switch (sessionName) {
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
            SESSION_END_MSG += `<strong>${sessionIcon} ${sessionName} SESSION</strong>\n\n`;
            SESSION_END_MSG += `<blockquote>\n\n`;
            signalHistory.map((history) => {
                SESSION_END_MSG += `<strong>${history.pair} - ${history.result}</strong>\n`;
            });
            SESSION_END_MSG += `\n</blockquote>\n`;
            SESSION_END_MSG += `<strong>${(numberToEmoji[sessionResult.wins])} ${(sessionResult.wins > 1) ? "WINS" : "WIN"} - ${(numberToEmoji[sessionResult.losses])} ${(sessionResult.losses > 1) ? "LOSSES" : "LOSS"}</strong>\n\n`;
            SESSION_END_MSG += `<strong>JOIN THE NEXT TRADE SESSION CLICK THE LINK BELOW 👇</strong>`;
            bot.sendPhoto(T_W_M, sessionEndPhotoStream, {
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
        };
        this.sendToChannel = (text, chatId, messageOption = undefined, successMessage, type = "text") => {
            if (type === "text") {
                if (messageOption === undefined) {
                    bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
                        .then(() => {
                        bot.sendMessage(T_W_M, text)
                            .then(() => {
                            bot.sendMessage(chatId, successMessage);
                        });
                    });
                }
                else {
                    bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
                        .then(() => {
                        bot.sendMessage(T_W_M, text, messageOption)
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
        this.sendMessageOnMBMOType = (MBMO, chatId) => {
            try {
                let messageOptions = {
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                };
                if ("replyMarkup" in MBMO) {
                    messageOptions = Object.assign(Object.assign({}, messageOptions), { reply_markup: MBMO.replyMarkup });
                }
                if ("video" in MBMO && MBMO.video !== undefined) {
                    const videoFilePath = join(__dirname, "./media/videos", MBMO.video.path);
                    const videoStream = createReadStream(videoFilePath);
                    if ("text" in MBMO) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption: MBMO.text });
                    }
                    if ("entities" in MBMO) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption_entities: MBMO.entities });
                    }
                    messageOptions = Object.assign(Object.assign({}, messageOptions), { width: MBMO.video.width, height: MBMO.video.height });
                    bot.sendVideo(chatId, videoStream, messageOptions, {
                        contentType: "application/octet-stream"
                    }).then((sentMessage) => {
                        if (chatId === TWM_ADMIN || chatId === INCENIX) {
                            climaxPostOnCreation.setState("lastPreviewMessageId", sentMessage.message_id);
                        }
                    }).catch((error) => {
                        console.log("Error sending message on MBMO type: ", error);
                        return false;
                    });
                    return true;
                }
                if ("image" in MBMO && MBMO.image !== undefined) {
                    // send photo message
                    const imageFilePath = join(__dirname, "./media/imgs", MBMO.image);
                    const imageStream = createReadStream(imageFilePath);
                    if ("text" in MBMO) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption: MBMO.text });
                    }
                    if ("entities" in MBMO) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { caption_entities: MBMO.entities });
                    }
                    bot.sendPhoto(chatId, imageStream, messageOptions, {
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
                if (MBMO.text !== undefined) {
                    if ("entities" in MBMO) {
                        messageOptions = Object.assign(Object.assign({}, messageOptions), { entities: MBMO.entities });
                    }
                    bot.sendMessage(chatId, MBMO.text, messageOptions)
                        .then((sentMessage) => {
                        if (chatId === TWM_ADMIN || chatId === INCENIX) {
                            climaxPostOnCreation.setState("lastPreviewMessageId", sentMessage.message_id);
                        }
                    }).catch((error) => {
                        console.log("Error sending message on MBMO type: ", error);
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
        };
        // this.lastAdmin = 0;
        this.lastAdmin = INCENIX;
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
const botManager = new ClimaxManager();
const handleSessionEnd = (sessionName, chatId, called = false) => {
    const signalHistory = signalManager.getHistory();
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
            bot.sendMessage(chatId, `Do you want to post the session end message for ${sessionName} session?`, options)
                .then(sentMessage => {
                const messageId = sentMessage.message_id;
                const sessionCanEnd = signalManager.checkSessionValidity();
                const timeoutId = setTimeout(() => {
                    if (sessionCanEnd) {
                        botManager.sendSessionEndMessage(signalHistory, sessionName);
                        signalManager.clearHistory();
                        botManager.setLastBotMessageId(chatId, 0);
                        bot.editMessageText("Session end message successfully posted...automatically", {
                            chat_id: chatId,
                            message_id: messageId
                        });
                        console.log("---------------------------------");
                        console.log("------- SESSION ENDED -----------");
                    }
                    if (!sessionCanEnd) {
                        bot.sendMessage(chatId, "Session has a signal without a result, can't end session yet...");
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
                            botManager.sendSessionEndMessage(signalHistory, sessionName);
                            signalManager.clearHistory();
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
            });
        }
        catch (err) {
            bot.sendMessage(chatId, "Unable to send session end message for some reason. Please try again..");
        }
    }
};
const scheduleClimaxCrons = () => {
    console.log("Will schedule all T_W_M crons...");
    const rawCronFileData = readFileSync(DATABASE.CRONS, 'utf-8');
    const cronFileData = JSON.parse(rawCronFileData);
    cronFileData.forEach((cronJob) => {
        // console.log(`Running ${cronJob.name} job at..`);
        cronJob.schedule.forEach((cronExpression) => {
            if (cronJob.id === "session_end") {
                cron.schedule(cronExpression, () => {
                    const lastController = botManager.getLastAdmin();
                    handleSessionEnd(cronJob.name, lastController);
                }, { timezone: cronJob.timezone });
            }
            else {
                const MBMO = botManager.getMessageFromBank({ id: cronJob.id });
                if (MBMO !== undefined) {
                    cron.schedule(cronExpression, () => {
                        // TODO: Implement job logic
                        console.log(`Posting message with id: ${cronJob.id}`);
                        botManager.sendMessageOnMBMOType(MBMO, T_W_M);
                    }, { timezone: cronJob.timezone });
                }
            }
        });
    });
};
scheduleClimaxCrons();
// start the bot
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
// creating and sending signals
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
// sedning results to channel
bot.onText(/\/result/, (msg) => {
    var _a;
    const chatId = (_a = msg === null || msg === void 0 ? void 0 : msg.from) === null || _a === void 0 ? void 0 : _a.id;
    const authorized = authorize(chatId);
    if (authorized) {
        const RESULT = {
            martingale0: "WIN⁰ ✅ - Direct WIN 🏆👏",
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
                    { text: "🟩 HIGHER", callback_data: "direction_up" },
                    { text: "🟥 LOWER ", callback_data: "direction_down" }
                ],
                [{ text: "◀ Back", callback_data: "hour_0" }],
            ];
            botManager.deleteAndSendNewMessage(text, messageId, chatId, keyboard);
        }
        if (action === "direction_up" || action === "direction_down") {
            signalManager.setDirection((action === "direction_up") ? "🟩 HIGHER" : "🟥 LOWER");
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
            T_W_M !== undefined) {
            const message = signalManager.createNewSignal();
            // lastAdmin = chatId;
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
                signalManager.setSignalResult(resultManager.callDirect());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callDirect());
            }
            if (action === "martingale1") {
                signalManager.setSignalResult(resultManager.callMartingale1());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale1());
            }
            if (action === "martingale2") {
                signalManager.setSignalResult(resultManager.callMartingale2());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale2());
            }
            if (action === "martingale3") {
                signalManager.setSignalResult(resultManager.callMartingale3());
                climaxPostOnCreation.setState("presentSignalResult", resultManager.callMartingale3());
            }
            if (action === "lossBoth") {
                signalManager.setSignalResult("❌ LOSS");
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
                const resultType = climaxPostOnCreation.presentSignalResult();
                const resultTypeDefined = resultType === resultManager.callLossType1() ? resultManager.callLossType2() : climaxPostOnCreation.presentSignalResult();
                const resultImage = climaxPostOnCreation.resultImagePath();
                bot.deleteMessage(chatId, botManager.lastBotMessageId(chatId)).then(() => {
                    if (resultImage !== undefined) {
                        bot.sendPhoto(T_W_M, resultImage, {
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
            if (resultImageWIthWatermark !== undefined) {
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
bot.onText(/\/endsession/, (msg) => {
    var _a;
    const presentSession = botManager.getPresentSession();
    const chatId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
    handleSessionEnd(presentSession, chatId, true);
});
app.get("/", (req, res) => {
    res.send("Halskey_TWM v1.1.0 is running...");
});
app.listen(port, () => {
    console.log("Halskey_TWM v1.1.0 is running...");
});
