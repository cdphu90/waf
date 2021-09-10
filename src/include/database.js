const path = require('path');
var sqlite3 = require('sqlite3').verbose();
const DBSOURCE = path.join(__dirname, '/db.sqlite');

var db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('=>Connected to the SQLite Database.');
        db.run(`DROP TABLE IF EXISTS tbl_user`);
        db.run(`CREATE TABLE IF NOT EXISTS tbl_user (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            address TEXT NOT NULL,
            description TEXT DEFAULT NULL,
            cookie TEXT DEFAULT NULL,
            date_login TEXT DEFAULT NULL
        )`, (err) => {
            if (!err) {
                var stmt = 'INSERT INTO tbl_user (nickname, password, username, email, address, description) VALUES (?,?,?,?,?,?)';
                db.run(stmt, ['admin', 'admin', 'Administrator','admin@uCase', 'Ho Chi Minh', 'Administrator User']);
                db.run(stmt, ['normal', 'normal', 'Normal Admin', 'normal@uCase', 'Ho Chi Minh', 'Normal Admin']);
                db.run(stmt, ['guest', 'guest', 'Guest Admin', 'guest@uCase', 'Ha Noi City', 'Guest User']);
            }
        });
    }
})

module.exports = db;