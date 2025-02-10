const Database = require('better-sqlite3');
const db = new Database('files.db');

// Initialize database
db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY,
        channel_id TEXT UNIQUE
    );
    
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY,
        channel_id TEXT,
        file_id TEXT,
        file_name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = {
    addChannel: (channelId) => db.prepare("INSERT OR IGNORE INTO channels (channel_id) VALUES (?)").run(channelId),
    getChannels: () => db.prepare("SELECT channel_id FROM channels").all(),
    addFile: (channelId, fileId, fileName) => 
        db.prepare("INSERT INTO files (channel_id, file_id, file_name) VALUES (?, ?, ?)").run(channelId, fileId, fileName),
    searchFiles: (query) => 
        db.prepare("SELECT * FROM files WHERE file_name LIKE ? LIMIT 50").all(`%${query}%`)
};
