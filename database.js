var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();
class Database {
    constructor(channelName) {
        this.initializeChannelId = (channelName) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.getChannelByName, [channelName]);
            return Number(result.rows[0].telegram_id);
        });
        this.getChannelId = () => this.channelId;
        this.getChannelCrons = () => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.getChannelCrons, [this.channelId]);
            return result.rows;
        });
        this.getChannelCronPosts = () => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.getChannelCronPosts, [this.channelId]);
            return result.rows;
        });
        this.getDaySignals = () => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.getDaySignals, [this.channelId]);
            return result.rows;
        });
        this.getSessionSignals = (session) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.getSignalsBySession, [this.channelId, session.toLocaleUpperCase()]);
            return result.rows;
        });
        this.saveSignal = (signal, session) => __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query(this.queries.createSignal, [session, signal.pair, signal.direction, signal.initialTime, this.channelId]);
        });
        this.updateSignal = (result) => __awaiter(this, void 0, void 0, function* () {
            yield this.pool.query(this.queries.updateSignalResult, [result, this.channelId]);
        });
        this.validate = (presentSession) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(this.queries.checkNullResultsInSession, [this.channelId, presentSession]);
            return result.rows;
        });
        this.pool = new Pool({
            connectionString: `postgresql://postgres.gktmbqflwqgrlggxrbse:${process.env.POSTGRES_PASS}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
            ssl: {
                rejectUnauthorized: false
            }
        });
        this.queries = {
            getChannelByName: `SELECT * FROM channels WHERE name = $1`,
            getChannelCrons: `SELECT * FROM crons WHERE telegram_id = $1`,
            getChannelCronPosts: `SELECT * FROM cron_posts WHERE telegram_id = $1`,
            getAllChannelSignals: `SELECT * FROM signals WHERE telegram_id = $1`,
            getDaySignals: `SELECT * FROM signals WHERE telegram_id = $1 AND DATE(time_stamp) = CURRENT_DATE ORDER BY session ASC`,
            getSignalsBySession: `SELECT * FROM signals WHERE telegram_id = $1 AND session = $2 AND DATE(time_stamp) = CURRENT_DATE`,
            createSignal: `INSERT INTO signals (session, pair, direction, initial_time, telegram_id) VALUES ($1, $2, $3, $4, $5)`,
            updateSignalResult: `UPDATE signals SET result = $1 WHERE time_stamp = (SELECT time_stamp FROM signals WHERE telegram_id = $2 ORDER BY time_stamp DESC LIMIT 1)`,
            checkNullResultsInSession: `SELECT * FROM signals WHERE telegram_id = $1 AND session = $2 AND Date(time_stamp) = CURRENT_DATE AND result IS NULL ORDER BY time_stamp DESC`
        };
        this.channelId = -1002101961419;
        // this.initializeChannelId(channelName);
    }
}
export default Database;
