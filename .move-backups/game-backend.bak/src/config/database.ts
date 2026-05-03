import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from the backend folder (two levels up from src/config)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '_';
const DB_NAME = process.env.DB_NAME || 'game_platform';
const DB_DATABASE = process.env.DB_DATABASE || 'ww_db';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

const pool = mysql.createPool({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_DATABASE,
	port: DB_PORT,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export default pool;
