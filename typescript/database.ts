import pg from 'pg';
import dotenv from 'dotenv';
import { DBSignal, DBCron, DBCronPost, History } from './types.js';

const { Pool } = pg
dotenv.config();

class Database {
    private pool;
    private queries;
    private channelId: number;

    constructor (channelName: string) {
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
            checkNullResults: `SELECT * FROM signals WHERE telegram_id = $1 AND result IS NULL ORDER BY time_stamp DESC`
        }

        this.channelId = -1002101961419;
        // this.initializeChannelId(channelName);
    }

    private initializeChannelId = async (channelName: string): Promise<number> => {
        const result = await this.pool.query(this.queries.getChannelByName, [channelName]);
        return Number(result.rows[0].telegram_id);
    }

    getChannelId = (): number => this.channelId;

    getChannelCrons = async (): Promise<DBCron[]> => {
        const result = await this.pool.query(this.queries.getChannelCrons, [this.channelId]);
        return result.rows;
    }

    getChannelCronPosts = async (): Promise<DBCronPost[]> => {
        const result = await this.pool.query(this.queries.getChannelCronPosts, [this.channelId]);
        return result.rows;
    }

    getDaySignals = async (): Promise<DBSignal[]> => {
        const result = await this.pool.query(this.queries.getDaySignals, [this.channelId]);
        return result.rows;
    }

    getSessionSignals = async (session: string): Promise<DBSignal[]> => {
        const result = await this.pool.query(this.queries.getSignalsBySession, [this.channelId, session.toLocaleUpperCase()]);
        return result.rows;
    }

    saveSignal = async (signal: History, session: string) => {
        await this.pool.query(this.queries.createSignal, [session, signal.pair, signal.direction, signal.initialTime, this.channelId]);
    }

    updateSignal = async (result: string) => {
        await this.pool.query(this.queries.updateSignalResult, [result, this.channelId]);
    }

    validate = async (): Promise<DBSignal[]> => {
        const result = await this.pool.query(this.queries.checkNullResults, [this.channelId]);
        return result.rows;
    }
}

export default Database;