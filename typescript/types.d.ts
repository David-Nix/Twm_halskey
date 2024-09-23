import TelegramBot, { ChatId, InlineKeyboardButton, InlineKeyboardMarkup, Message, MessageEntity } from "node-telegram-bot-api";

export interface MessageBankMessage {
  name?: string;
  id?: string;
  text?: string;
  image?: string;
  video?: {
    width: number;
    height: number;
    path: string;
  };
  entities?: TelegramBot.MessageEntity[];
  replyMarkup?: TelegramBot.InlineKeyboardMarkup;
  otherOptions?: TelegramBot.Message;
}

export interface Signal {
  pair: string;
  hour: number;
  minute: number;
  direction: string;
  lastStep: string;
  // lastStep: string;
  // stepCount: number;
  // resultHistory: string[];
}


export type ISO8601Date = string & { __isISO8601Date: true };

export interface History {
  dateStamp: ISO8601Date;
  pair: string;
  direction: string;
  result: string | null;
  initialTime: string;
}

export type SignalHistory = History[]

export interface dayHistory {
  [key: string]: SignalHistory
}

export interface CurrencyPairs {
  text: string;
  step0: {
      text: string;
      callback_data: string;
  }[][];
  step1: {
      text: string;
      callback_data: string;
  }[][];
  step2: {
      text: string;
      callback_data: string;
  }[][];
  step3: {
      text: string;
      callback_data: string;
  }[][];
}






















// export interface MessageBank {
//   [key: string]: MessageBankMessage;
// }

type ResultType = {
    martingale0: string;
    martingale1: string;
    martingale2: string;
    martingale3: string;
    loss: string;
}

export interface Result {
    type: ResultType;
    text: string;
    image: string | null;
}

export interface Session {
  startHour: number;
  startMinute: number;
  blub: string;
  icon: string;
  videoPath: string;
  photoDir: string;
}

export interface SessionEnd {
  wins: number | null;
  losses: number | null;
}

export interface PostCreationStates {
  [key: ChatId]: string
}

export type ButtonPost = {
  post: string;
  buttons: InlineKeyboardButton[][];
  entities: MessageEntity[]
};

export type MessageBank = ButtonPost[];

export type ClimaxPostPreview = {
  name: string;
  id: string;
}

export interface WTS {
  name: string;
  id: string;
  text?: string;
  image?: string;
  video?: {
    width: number;
    height: number;
    path: string;
  };
  entities?: TelegramBot.MessageEntity[];
  replyMarkup?: TelegramBot.InlineKeyboardMarkup;
  otherOptions?: TelegramBot.Message;
}

export type ClimaxCronJobObject = {
  name: string;
  id: string;
  schedule: string[];
  timezone: string;
}

export type ClimaxPostState = {
  awaitingPostText: boolean;
  awaitingPostPhoto: boolean;
  awaitingPostVideo: boolean;
  awaitingResultImage: boolean;
  chosenSignalResult: boolean;
  presentSignalResult: string;
  resultImagePath: string;
  lastPreviewMessageId: number;
}