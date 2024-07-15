import TelegramBot, {
  Chat,
  ChatId,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
  MessageEntity,
} from "node-telegram-bot-api";

import {
  MessageBankMessage,
  Signal,
  History,
  SignalHistory,
  CurrencyPairs,
  Session,
  SessionEnd,
  PostCreationStates,
  ButtonPost,
  MessageBank,
  ClimaxPostPreview,
  WTS,
  Result,
  ClimaxCronJobObject,
  ClimaxPostState,
  ISO8601Date,
} from "./types.js";

import {
  v4 as uuidv4,
  version as uuidVersion,
  validate as uuidValidate,
} from "uuid";

import express, { Express } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import cron from "node-cron";
import axios from "axios";
import { readFileSync, writeFileSync, createReadStream, watchFile } from "fs";
import dotenv from "dotenv";

dotenv.config();
process.env["NTBA_FIX_350"] = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;
// app.use("/media/imgs", express.static(join(__dirname, "./media/imgs")));

const token: string | undefined = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not defined");
}

const bot: TelegramBot = new TelegramBot(token, {
  filepath: false,
  polling: true,
});

const TWM_ADMIN: number | undefined = Number(process.env.OWNER);
const INCENIX: number | undefined = Number(process.env.INCENIX);
const T_W_M: number | undefined = Number(process.env.CHANNEL);
const atomix: number | undefined = Number(process.env.ATOMIX);

const authorize = (chatId: ChatId): boolean => {
  if (chatId === INCENIX || chatId === TWM_ADMIN) {
      return true;
  } else {
      return false;
  }
}

const DATABASE = {
  POSTS: join(__dirname, "./database/posts.json"),
  HISTORY: join(__dirname, "./database/history.json"),
  CRONS: join(__dirname, "./database/crons.json"),
};

const downloadAndSavePhoto = async ( fileId: string ): Promise<{ fileRelativePath: string | undefined; fileUrl: string}> => {
  let fileRelativePath: string | undefined = undefined;
  let fileUrl = "";

  if (fileId !== undefined) {
    const filetoGet = await bot.getFile(fileId);
    const fileName = filetoGet.file_path?.replace("photos/", "").trim();

    fileUrl = `https://api.telegram.org/file/bot${token}/${filetoGet.file_path}`;
    const downloadPath = join(__dirname, "./media/imgs");

    fileRelativePath =
      fileName !== undefined
        ? join(__dirname, "./media/imgs/", fileName)
        : undefined;

    try {
      await bot.downloadFile(fileId, downloadPath);
      console.log("Photo downloaded successfully...");
    } catch (err) {
      console.log("Error downloading photo");
      fileRelativePath = undefined;
    }
  } else {
    console.log("No photo found ...or photo has no file_id");
  }

  return { fileRelativePath, fileUrl }
};

const numberToEmoji: { [key: number]: string } = {
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
  CurrencyPairs: CurrencyPairs;
  Signal: Signal;
  History: SignalHistory;

  constructor() {
    this.Signal = {
      pair: "",
      hour: 0,
      minute: 0,
      direction: "",
      lastStep: "pairs_0"
    };

    this.History = [
      {
        dateStamp: "" as ISO8601Date,
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

  createNewSignal = (): string => {
    const padZero = (num: number): string => num.toString().padStart(2, "0");
    const getNextTime = (h: number, m: number, increment: number): string => {
      m += increment;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m %= 60;
      }
      h %= 24;
      return `${padZero(h)}:${padZero(m)}`;
    };

    const entryTime: string = `${padZero(this.Signal.hour)}:${padZero(this.Signal.minute)}`;
    const martingaleLevels: string[] = [
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
      dateStamp: timeAndDateSTamp as ISO8601Date,
      pair: this.Signal.pair,
      direction: this.Signal.direction,
      result: null
    });

    return SIGNAL_MSG;
  };

  getCurrencyPairTextFromCallbackData = (
    callbackData: string
  ): string | null => {
    return (
      Object.values(this.CurrencyPairs)
        .flatMap((step) => (Array.isArray(step) ? step : []))
        .flatMap((item) => (Array.isArray(item) ? item : [item]))
        .find((item) => item.callback_data === callbackData)?.text || null
    );
  };

  clearHistory = () => {
    this.History = [];
  }

  getHistory = () => this.History;

  setSignalResult = (resultString: string) => this.History[this.History.length - 1].result = resultString;

  setLastStep = (step: string) => this.Signal.lastStep = step;
  setPair = (pair: string) => this.Signal.pair = pair;
  setHour = (hour: number) => this.Signal.hour = hour;
  setMinute = (minute: number) => this.Signal.minute = minute;
  setDirection = (direction: string) => this.Signal.direction = direction;

  setAccurateSignalStep = (manualNext: string): string => {
    if (this.Signal.lastStep !== null) {
      return this.Signal.lastStep;
    } else {
      return manualNext;
    }
  }

  presentSignal = () => this.Signal;
  checkSignalObject = (action: string) => {
    if (
      action === "post_signal" &&
      typeof this.Signal.hour === "number" &&
      typeof this.Signal.minute === "number"
    ) {
      return true;
    } else {
      return false;
    }
  }

  lastStep = () => this.Signal.lastStep;
  step0 = () => this.CurrencyPairs.step0;
  step1 = () => this.CurrencyPairs.step1;
  step2 = () => this.CurrencyPairs.step2;
  step3 = () => this.CurrencyPairs.step3;
  text = () => this.CurrencyPairs.text;
}

const signalManager = new ClimaxSignal();

class ResultManager {
  directWin: string;
  martingale1: string;
  martingale2: string;
  martingale3: string;
  lossType1: string;
  lossType2: string;

  constructor() {
    this.directWin = "WIN⁰ ✅ - Direct WIN 🏆👏";
    this.martingale1 = "✅ WIN¹ ✅ - Victory in Martingale 1 🫵";
    this.martingale2 = "✅ WIN² ✅ - Victory in Martingale 2 🫵";
    this.martingale3 = "✅ WIN³ ✅ - Victory in Martingale 3 🫵";
    this.lossType1 = "❌";
    this.lossType2 = "❌";
  }

  callDirect = (): string => this.directWin;
  callMartingale1 = (): string => this.martingale1;
  callMartingale2 = (): string => this.martingale2;
  callMartingale3 = (): string => this.martingale3;
  callLossType1 = (): string => this.lossType1;
  callLossType2 = (): string => this.lossType2;

  callLossType2Image = async (fileId: string) => {
    try {
      const watermarkPath = `https://lh3.googleusercontent.com/pw/AP1GczPt3db3v4XAjMGyZIo94YUcG0Oqa4Shvq8SmBpheJ3Qz3Tk9BzQAhm-HC6kwQWQhy85PW9kPPGGkJAaYB7hn1kKP0SQ_sStZCNokOrMspgBWZetkBuwkNAFKHhMZD_GW43Edc771MVyDOYfAP9Com83QJFx6-xVRiHcNg-cQ7EkRXAZ2cKPaJzdeytdYB0GQO3UfHkEjbnK_CMOm_Cef0oqadY_8wgJYBKO5Ia_WCqcfT5oM2GlTrVyhx2ed6_FrBwi_BY9tihd8su0FnE7gNE6ceUr3vYd9w1jeZziPmHkPfa_xPbwr_WzqJmwNJDljyDRaBPlZYDiaUxuW0_KP5dETGtR_6LlqFF-3LB-axuq4GpbJaaUgDEn9MVaX207va7hN0xqHlBa7TYIaGEc0fANi38BR3DKdqLqFdWqPpUe6foiLNp8ON5Ib1yegjtfGW9s_-2kr_VtvPCLNHIMb_CHuHgfeOT8iBckYr_Hkg6aLu8R11eBgIyznxVLxidOR_ffs4bVB2u0XwOucs4eoFWIVvVcbkBQs-mE2RIggXyg8OBLFoNS-rGR3E8l8U5vLR3nlxrAU-ziH7GWO_wyWNB99UhoT7pfzxcpvfvyuCMrHrqnJ_mGsCaGFYxguUIDoTMyRWNQNPVXIi1Vg2HiP30ikiVWOLTiYxuJs3DRVGbxCJw87CwsDd685hTNAgdkSl3WrxM2me_NDW3Fke_aSZJNlRLCC728aljTp-iKSz_JuuP3-gKnzqluNVPLt7fmKhZXGC6ul7TiroUYLAuMr898F6kyz53BYlVp4va0WljphF7QNE_BSUJk8JyGMAfQnKNb3wlMiOm17lUYEh_V0-xe8xko5Y8ov3ozarTVgT4V5-BrDPQD1GxLwnvisc9LxnGAP5id5utAzsq9K3I3lv-yx8S6XXM1XQD-897VKwUPhVKJogmlIUmJwphN9oocdxAET8WWmUDitwtJoA=w691-h590-no?authuser=0`;
      const mainPhotoPath = await downloadAndSavePhoto(fileId);

      const quickChartLink = `https://quickchart.io/watermark?mainImageUrl=${mainPhotoPath.fileUrl}&markImageUrl=${watermarkPath}&markRatio=0.7&position=center&opacity=1`
      return quickChartLink;

    } catch (error) {
      console.error("Error adding watermark:", error);
    }
  };
  
}

const resultManager = new ResultManager();

class ClimaxPostCreation {
  STATE: ClimaxPostState;
  POST: WTS;

  constructor() {
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

  public setPostText = (value: string) => {
    this.POST.text = value;
    // this.setState("awaitingPostText", false);
  };

  public setPostPhoto = (value: string) => {
    this.POST.image = value;
    // this.setState("awaitingPostPhoto", false);
  };

  public setPostVideo = (width: number, height: number, path: string) => {
    this.POST.video = { width, height, path };
    // this.setState("awaitingPostVideo", false);
  };

  public setPostEntites = (messageEntity: TelegramBot.MessageEntity[]) => {
    this.POST.entities = messageEntity;
  };

  public setPostReplyMarkup = (
    inlineMarkup: TelegramBot.InlineKeyboardButton[][]
  ) => {
    this.POST.replyMarkup = {
      inline_keyboard: inlineMarkup,
    };
  };

  setState = (
    key: keyof ClimaxPostState,
    value: boolean | string | number
  ): void => {
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

  correspondingResponse = (): WTS => {

    const corRes: WTS = {
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

  public awaitingPostText = (): boolean => this.STATE.awaitingPostText;

  public awaitingPostPhoto = (): boolean => this.STATE.awaitingPostPhoto;

  public awaitingPostVideo = (): boolean => this.STATE.awaitingPostVideo;

  public awaitingResultImage = (): boolean => this.STATE.awaitingResultImage;

  public chosenSignalResult = (): boolean => this.STATE.chosenSignalResult;

  public presentSignalResult = (): string => this.STATE.presentSignalResult;

  public resultImagePath = (): string => this.STATE.resultImagePath;

  public lastPreviewMessageId = (): number => this.STATE.lastPreviewMessageId;

  public presentPostData = (): WTS => this.POST;
}

const climaxPostOnCreation = new ClimaxPostCreation();

class ClimaxManager {
  private lastAdmin: ChatId;
  private presentSession: string;

  CONVERSATIONS: {
      [key: ChatId]: {
          lastBotMessageId: number;
          lastPreviewId: number;
      }
  }

  constructor () {
      // this.lastAdmin = 0;
      this.lastAdmin = INCENIX as ChatId;
      this.presentSession = "";
    
      this.CONVERSATIONS = {
          [TWM_ADMIN as ChatId]: {
              lastBotMessageId: 0,
              lastPreviewId: 0
          },
          [INCENIX as ChatId]: {
              lastBotMessageId: 0,
              lastPreviewId: 0
          }
      }
  }

  lastBotMessageId = (chatId: ChatId): number => this.CONVERSATIONS[chatId].lastBotMessageId

  setLastAdmin = (chatId: ChatId): void => {
    this.lastAdmin = chatId;
  }

  setLastBotMessageId = (chatId: ChatId, messageId: number) => {
    this.CONVERSATIONS[chatId].lastBotMessageId = messageId;
  }

  setPresentSession = (sessionName: string): void => {
    this.presentSession = sessionName;
  }

  getLastAdmin = () => this.lastAdmin;
  getPresentSession = () => this.presentSession;

  getMessageFromBank = (findObject: {[key: string]: string}): WTS => {
    const rawMessageBankData = readFileSync(DATABASE.POSTS, 'utf-8');
    const messageBankData = JSON.parse(rawMessageBankData);
  
    const messageObject = messageBankData.find((dataObject: WTS) => 
      Object.keys(findObject).every(key => dataObject[key as keyof WTS] === findObject[key])
    );
    
    return messageObject;
  }

  sendSessionEndMessage = (signalHistory: SignalHistory, sessionName: string) => {

    const sessionEndPhotoPath = join(__dirname, "./media/imgs/brand/session_end.jpg");
    const sessionEndPhotoStream = createReadStream(sessionEndPhotoPath);

    const countWinsAndLosses = (history: History[]): { wins: number; losses: number } => {
      return history.reduce(
        (acc, entry) => ({
          wins: acc.wins + ((entry.result as string).includes("WIN") ? 1 : 0),
          losses: acc.losses + (!((entry.result as string).includes("WIN")) ? 1 : 0),
        }),
        { wins: 0, losses: 0 }
      );
    }

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
  
    let SESSION_END_MSG = `<strong>📝 REPORT</strong>\n`
        SESSION_END_MSG += `<strong>${sessionIcon} ${sessionName} SESSION</strong>\n\n`
        SESSION_END_MSG += `<blockquote>\n\n`;
        signalHistory.map((history: History) => {
          SESSION_END_MSG += `<strong>${history.pair} - ${history.result}</strong>\n`
        })
        SESSION_END_MSG += `\n</blockquote>\n`;
        SESSION_END_MSG += `<strong>${(numberToEmoji[sessionResult.wins])} ${(sessionResult.wins > 1) ? "WINS" : "WIN"} - ${(numberToEmoji[sessionResult.losses])} ${(sessionResult.losses > 1) ? "LOSSES" : "LOSS"}</strong>\n\n`;
        SESSION_END_MSG += `<strong>JOIN THE NEXT TRADE SESSION CLICK THE LINK BELOW 👇</strong>`;
    
    bot.sendPhoto(T_W_M as ChatId, sessionEndPhotoStream, {
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

  sendToChannel = (text: string, chatId: ChatId, messageOption: TelegramBot.SendMessageOptions | undefined = undefined, successMessage: string, type: string = "text") => {
    if (type === "text") {
      if (messageOption === undefined) {
        bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
        .then(() => {
        bot.sendMessage(T_W_M as ChatId, text)
        .then(() => {
          bot.sendMessage(chatId, successMessage);
        })
      })
      } else {
        bot.deleteMessage(chatId, this.CONVERSATIONS[chatId].lastBotMessageId)
        .then(() => {
          bot.sendMessage(T_W_M as ChatId, text, messageOption)
          .then(() => {
            bot.sendMessage(chatId, successMessage);
          })
        })
      }
    }

    climaxPostOnCreation.setState("resultImagePath", "");
    climaxPostOnCreation.setState("awaitingResultImage", false);
  }

  deleteAndSendNewMessage = (
    newText: string,
    messageId: number,
    recipient: ChatId,
    newKeyboard: TelegramBot.KeyboardButton[][] | undefined = undefined
  ) => {
    if (this.CONVERSATIONS[recipient].lastBotMessageId !== undefined && messageId !== undefined) {

      bot.deleteMessage(recipient as ChatId, this.CONVERSATIONS[recipient].lastBotMessageId || messageId)
        .then(() => {

          if (newKeyboard !== undefined) {
            bot.sendMessage(recipient as ChatId, newText, {
              parse_mode: "HTML",
              reply_markup: { inline_keyboard: newKeyboard }
            })
            .then((sentMessage) => {
              this.CONVERSATIONS[recipient].lastBotMessageId = sentMessage.message_id;
            })
            .catch((error) => {
              console.error("Error deleting message: ", error);
            });
          } else {
            bot.sendMessage(recipient as ChatId, newText, {
              parse_mode: "HTML"
            })
            .then((sentMessage) => {
              this.CONVERSATIONS[recipient].lastBotMessageId = sentMessage.message_id;
            })
            .catch((error) => {
              console.error("Error deleting message: ", error);
            });
          }
        })
        
    }
  };

  sendMessage = (chatId: ChatId, text: string, messageOptions?: TelegramBot.SendMessageOptions) => {
    if (messageOptions === undefined) {
      return bot.sendMessage(chatId, text)
      .then((sentMessage) => {
        this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
        return sentMessage;
      })
    } else {
      return bot.sendMessage(chatId, text, messageOptions)
      .then((sentMessage) => {
        this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
        return sentMessage;
      })
    }
  }

  sendPhoto = (chatId: ChatId, text: string, photoOptions?: TelegramBot.SendPhotoOptions) => {
    if (photoOptions === undefined) {
      return bot.sendMessage(chatId, text)
      .then((sentMessage) => {
        this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
        return sentMessage;
      })
    } else {
      return bot.sendMessage(chatId, text, photoOptions)
      .then((sentMessage) => {
        this.CONVERSATIONS[chatId].lastBotMessageId = sentMessage.message_id;
        return sentMessage;
      })
    }
  }

  sendMessageOnMBMOType = (MBMO: WTS, chatId: ChatId): boolean => {
    try {
      let messageOptions: TelegramBot.SendMessageOptions | TelegramBot.SendPhotoOptions | TelegramBot.SendVideoOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true
      };
    
      if ("replyMarkup" in MBMO) {
        messageOptions = {
         ...messageOptions,
          reply_markup: MBMO.replyMarkup
        }
      }
    
      if ("video" in MBMO && MBMO.video !== undefined) {
    
        const videoFilePath = join(__dirname, "./media/videos", MBMO.video.path);
        const videoStream = createReadStream(videoFilePath);
    
        if ("text" in MBMO) {
          messageOptions = {
           ...messageOptions,
            caption: MBMO.text
          }
        }
    
        if ("entities" in MBMO) {
          messageOptions = {
           ...messageOptions,
           caption_entities: MBMO.entities
          }
        }
    
        messageOptions = {
          ...messageOptions,
          width: MBMO.video.width,
          height: MBMO.video.height
        }
    
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
          messageOptions = {
           ...messageOptions,
            caption: MBMO.text
          }
        }
    
        if ("entities" in MBMO) {
          messageOptions = {
           ...messageOptions,
           caption_entities: MBMO.entities
          }
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
          messageOptions = {
           ...messageOptions,
            entities: MBMO.entities
          }
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
    } catch (error) {
      console.error(error);
      return false;
    }
  
    return true
  }

}

const botManager = new ClimaxManager();
























const handleSessionEnd = (sessionName: string, chatId: ChatId, called: boolean = false) => {
  const signalHistory = signalManager.getHistory();

  if (called && signalHistory.length === 0) {
    bot.sendMessage(chatId as ChatId, "No signal has been sent this session, so there's nothing to end");
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
  
        const timeoutId = setTimeout(() => {
          botManager.sendSessionEndMessage(signalHistory, sessionName);
          signalManager.clearHistory();
          botManager.setLastBotMessageId(chatId as ChatId, 0);
          bot.editMessageText("Session end message successfully posted...automatically", {
            chat_id: chatId,
            message_id: messageId
          })
          console.log("---------------------------------");
          console.log("------- SESSION ENDED -----------");
        }, 5 * 60 * 1000);
  
        bot.on('callback_query', callbackQuery => {
          if (callbackQuery.message?.message_id === messageId) {
            clearTimeout(timeoutId);
            const response = callbackQuery.data;
            if (response === 'yes') {
              botManager.sendSessionEndMessage(signalHistory, sessionName);
              signalManager.clearHistory();
              botManager.setLastBotMessageId(chatId as ChatId, 0);
              bot.editMessageText("Session end message successfully posted...", {
                chat_id: chatId,
                message_id: messageId
              });
              console.log("---------------------------------");
              console.log("------- SESSION ENDED -----------");
            }

            if (response === 'no') {
              bot.editMessageText("Okay, but you will need to end the session manually...YOURSELF", {
                chat_id: chatId,
                message_id: messageId
              });
            }
          }
        });
      });
      
    } catch (err) {
      bot.sendMessage(chatId as ChatId, "Unable to send session end message for some reason. Please try again..");
    }
  }
}


const scheduleClimaxCrons = () => {
  console.log("Will schedule all T_W_M crons...");

  const rawCronFileData = readFileSync(DATABASE.CRONS, 'utf-8');
  const cronFileData = JSON.parse(rawCronFileData);

  cronFileData.forEach((cronJob: ClimaxCronJobObject) => {
    // console.log(`Running ${cronJob.name} job at..`);

    cronJob.schedule.forEach((cronExpression) => {
      if (cronJob.id === "end") {

        cron.schedule(cronExpression, () => {
          const lastController = botManager.getLastAdmin();
          handleSessionEnd(cronJob.name, lastController as ChatId);
        }, { timezone: cronJob.timezone });

      } else {
        const MBMO: WTS = botManager.getMessageFromBank({ id: cronJob.id });

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

bot.onText(/\/start/, (msg: TelegramBot.Message) => {
  const chatId: ChatId | undefined = msg?.from?.id;
  const firstName: string | undefined = msg?.from?.first_name;

  const authorized = authorize(chatId as ChatId);

  if (authorized) {

    let START_MSG = `<strong>Hello, ${firstName}!</strong>\n\n`;
        START_MSG += `I'm <strong>Halskey</strong>, your channel bot! 📈🚀\n`;
        START_MSG += `I can help you with:\n\n`;
        START_MSG += `<strong>- 📡 Posting signals (i auto-calculate the martingales)</strong>\n`;
        START_MSG += `<strong>- 📡 Ending a trading session</strong>\n`;
        START_MSG += `<strong>- 📅 Scheduling posts to be published on your channel</strong>\n`;
        START_MSG += `<strong>- 📝 Creating posts with buttons (one or multiple)</strong>\n\n`;
        START_MSG += `<strong>There's a new menu button on your telegram input field, you can find my commands there :)</strong>\n`;

    bot.sendMessage(chatId as ChatId, START_MSG, { parse_mode: "HTML" });
  } else {
    bot.sendMessage(chatId as ChatId, "You are not authorized to use this bot");
  }
  
});

// creating and sending signals

bot.onText(/\/signal/, (msg: TelegramBot.Message) => {
  const chatId: ChatId | undefined = msg?.from?.id;
  const authorized = authorize(chatId as ChatId);

  if (authorized) {
    const pairText = signalManager.text();
    const pairsKeyboard = signalManager.step0();

    bot.sendMessage(chatId as ChatId, pairText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: pairsKeyboard
      },
    })
    .then((sentMessage) => {
      botManager.setLastBotMessageId(chatId as ChatId, sentMessage.message_id);
    });
  } else {
    bot.sendMessage(chatId as ChatId, "You are not authorized to use this bot");
  }
  
});

const pairRegex = /[A-Z]{3}\/[A-Z]{3} \(OTC\)/;
const hourRegex = /.*hour_.*/;
const minuteRegex = /.*minute_.*/;
const winRegex = /.*martingale.*/;

// sedning results to channel

bot.onText(/\/result/, (msg: TelegramBot.Message) => {
  const chatId: ChatId | undefined = msg?.from?.id;
  const authorized = authorize(chatId as ChatId);

  if (authorized) {
    const RESULT = {
      martingale0: "WIN⁰ ✅ - Direct WIN 🏆👏",
      martingale1: "✅ WIN¹ ✅ - Victory in Martingale 1 ☝",
      martingale2: "✅ WIN² ✅ - Victory in Martingale 2 ☝",
      martingale3: "✅ WIN³ ✅ - Victory in Martingale 3 ☝",
      lossBoth: "LOSS ❌"
    }

    const POST_RESULT_MSG_1 = "Choose one of the options below:";
    const keyboard = Object.entries(RESULT).map(([key, value]) => ([{
      text: value,
      callback_data: key
    }]));

    keyboard.push([{ text: "Cancel Operation", callback_data: "cancel_op" }]);

    bot.sendMessage(chatId as ChatId, POST_RESULT_MSG_1, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard
      },
    }).then((sentMessage) => {
      botManager.setLastBotMessageId(chatId as ChatId, sentMessage.message_id);
    });
  } else {
    bot.sendMessage(chatId as ChatId, "You are not authorized to use this bot");
  }
})






































bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
  const msg = callbackQuery.message;
  const chatId: ChatId | undefined = msg?.chat.id;
  const messageId: number | undefined = msg?.message_id;
  const action = callbackQuery.data;
  const authorized = authorize(chatId as ChatId);

  if (authorized) {
    if (action === undefined) {
      console.error("CallBackQuery action is undefined");
      return;
    }

    if ((action === "cancel_op" || action === "cancel_buttonpost") && messageId !== undefined) {
      const CSR = climaxPostOnCreation.chosenSignalResult();
      const lastHalskeyMessageId = botManager.lastBotMessageId(chatId as ChatId);

      if (CSR === true) {
        climaxPostOnCreation.setState("chosenSignalResult", false);
      }

      bot.deleteMessage(chatId as ChatId, lastHalskeyMessageId || messageId)
        .then(() => {
          bot.sendMessage(chatId as ChatId, "Operation Canceled")
        })
    }

    // callback quering for signals

    if (action === "pairs_0") {
      const currencyText = signalManager.text();
      const pairsKeyboard = signalManager.step0();
      botManager.deleteAndSendNewMessage(currencyText, messageId as number, chatId as ChatId, pairsKeyboard);

      signalManager.setLastStep("pairs_0");
    }

    if (action === "pairs_1") {
      const currencyText = signalManager.text();
      const pairsKeyboard = signalManager.step1();
      botManager.deleteAndSendNewMessage(currencyText, messageId as number, chatId as ChatId, pairsKeyboard);
      
      signalManager.setLastStep("pairs_1");
    }

    if (action === "pairs_2") {
      const currencyText = signalManager.text();
      const pairsKeyboard = signalManager.step2();
      botManager.deleteAndSendNewMessage(currencyText, messageId as number, chatId as ChatId, pairsKeyboard);
      
      signalManager.setLastStep("pairs_2");
    }

    if (action === "pairs_3") {
      const currencyText = signalManager.text();
      const pairsKeyboard = signalManager.step3();
      botManager.deleteAndSendNewMessage(currencyText, messageId as number, chatId as ChatId, pairsKeyboard);

      signalManager.setLastStep("pairs_3");
    }

    if (pairRegex.test(action) || action === "restep_time") {

      let text = "🕓 What time (HOUR) would you like to start?\n\n0 is the same as 24 or 12am midnight...";
      if (pairRegex.test(action)) {
        if (action !== "SSS/TTT (OTC)") {
          const pairWithFlags = signalManager.getCurrencyPairTextFromCallbackData(action);
          signalManager.setPair(pairWithFlags as string);
        }
      }

      const hours = Array.from({ length: 24 }, (_, i) => ({
        text: i.toString(),
        callback_data: `hour_${i}`,
      }));
      
      const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

      for (let i = 0; i < hours.length; i += 6) {
        keyboard.push(hours.slice(i, i + 6));
      }

      keyboard.push([{ text: "◀ Back", callback_data: signalManager.setAccurateSignalStep("pairs_0") }]);

      botManager.deleteAndSendNewMessage(text, messageId as number, chatId as ChatId, keyboard);

    }

    if (hourRegex.test(action)) {
      let text = "🕓 What time (MINUTE) would you like to start?\n\nthe back button is on the last row instead of 60";
      signalManager.setHour(Number(action.replace(/^hour_/, "")));;
    
      const minute = Array.from({ length: 12 }, (_, i) => ({
        text: (i * 5).toString(),
        callback_data: `minute_${i * 5}`,
      }));
    
      const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
    
      for (let i = 0; i < minute.length; i += 6) {
        keyboard.push(minute.slice(i, i + 6));
      }
      keyboard.push([{ text: "◀", callback_data: "SSS/TTT (OTC)" }]);
    
      botManager.deleteAndSendNewMessage(text, messageId as number, chatId as ChatId, keyboard);
    }    

    if (minuteRegex.test(action) || action === "restep_direction") {
      signalManager.setMinute(Number(action.replace(/^minute_/, "")))

      let text = "↕ What direction would you like to go?\nChoose an option below:";

      const keyboard = [
        [
          { text: "🟩 HIGHER", callback_data: "direction_up" },
          { text: "🟥 LOWER ", callback_data: "direction_down" }
        ],
        [{ text: "◀ Back", callback_data: "hour_0" }],
      ];

      botManager.deleteAndSendNewMessage(text, messageId as number, chatId as ChatId, keyboard);
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

      botManager.deleteAndSendNewMessage(text, messageId as number, chatId as ChatId, keyboard);
    }

    if (
      signalManager.checkSignalObject(action) &&
      T_W_M !== undefined
    ) {
      const message = signalManager.createNewSignal()

      // lastAdmin = chatId;

      botManager.sendToChannel(message, chatId as ChatId, {
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
      botManager.deleteAndSendNewMessage(RESULT_IMAGE_TXT, messageId as number, chatId as ChatId)
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
        [{ text: "🖼 Add Image", callback_data: "result_image"}],
        [{ text: "⏫ Just Send", callback_data: "send_result"}],
        [{ text: "Cancel Operation", callback_data: "cancel_op" }]
      ]
      
      botManager.deleteAndSendNewMessage(RESULT_TXT, messageId as number, chatId as ChatId, keyboard)
    }

    if (action === "send_result") {

      const ARI = climaxPostOnCreation.awaitingResultImage();

      if (ARI) {
        const resultType = climaxPostOnCreation.presentSignalResult();
        const resultTypeDefined = resultType === resultManager.callLossType1() ? resultManager.callLossType2() : climaxPostOnCreation.presentSignalResult()
        const resultImage = climaxPostOnCreation.resultImagePath();

        bot.deleteMessage(chatId as ChatId, botManager.lastBotMessageId(chatId as ChatId)).then(() => {
          if (resultImage !== undefined) {
            bot.sendPhoto(T_W_M, resultImage, {
              caption: resultTypeDefined
            }).then(() => bot.sendMessage(chatId as ChatId, "Result posted successfully..."));
          }
        })

      } else {
        const PSR = climaxPostOnCreation.presentSignalResult();

        if (PSR === resultManager.callLossType1()) {
          botManager.sendToChannel("❌", chatId as ChatId, undefined, "Result Sent Successfully.");
          return;
        }

        botManager.sendToChannel(PSR, chatId as ChatId, {
          parse_mode: "HTML"
        }, "Result posted successfully...");
      }

      botManager.setLastAdmin(chatId as ChatId);
    }
  } else {
    bot.sendMessage(chatId as ChatId, "You are not authorized to use this bot");
  }

})


// PHOTO LISTENERS AND LOGIC

bot.on("photo", async (message: TelegramBot.Message) => {
    const chatId: ChatId | undefined = message?.chat.id;
    const messageId: number | undefined = message?.message_id;
    const fileId = message?.photo?.[message.photo.length-1].file_id || undefined;
    const authorized = authorize(chatId as ChatId);
  
    if (authorized) {
        //photo listener and operations
        const ARI = climaxPostOnCreation.awaitingResultImage();
        if (ARI) {
          const resultImageWIthWatermark = await resultManager.callLossType2Image(fileId as string);
          if (resultImageWIthWatermark !== undefined) {
            const keyboard = [
              [{ text: "⏫ Send to Channel", callback_data: "send_result"}],
              [{ text: "Cancel Operation", callback_data: "cancel_op" }]
            ]

            climaxPostOnCreation.setState("resultImagePath", resultImageWIthWatermark);
            botManager.deleteAndSendNewMessage("Photo received and saved, what to do next?:", messageId, chatId as ChatId, keyboard);
          } else {
            bot.sendMessage(chatId as ChatId, "Sorry, I couldn't download the picture and save");
          }
        }
    } else {
        bot.sendMessage(chatId as ChatId, "You are not authorized to use this bot");
    }

})



bot.onText(/\/endsession/, (msg: TelegramBot.Message) =>{
  const presentSession = botManager.getPresentSession();
  const chatId = msg.from?.id;
  handleSessionEnd(presentSession, chatId as ChatId, true);
})




app.get("/", (req, res) => {
    res.send("Halskey_TWM v1.0.0 is running...");
});

app.listen(port, () => {
    console.log("Halskey_TWM v1.0.0 is running...");
});