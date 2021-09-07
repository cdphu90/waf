const path = require('path');
const express = require('express');
//const morgan = require('morgan');
const handlebars = require('express-handlebars');
const cookieParse = require('cookie-parser');
const uuid = require('uuid');
const exec = require('child_process').exec;
const db = require('./include/database.js');
const { stdout, stderr } = require('process');
const app = express();
const port = 8080;
const cookie_name = 'user_session';
const undef = 'undefined';

/* Global Restful API message */
const res_stt = 'stt';
const res_err = 'error';
const res_msg = 'message';
const res_success = 'success';

// Use cookie
app.use(cookieParse());
// Use static
app.use(express.static(path.join(__dirname, 'public')));
// Nodejs Logger
//app.use(morgan('combined'));
// Express handlebars
app.engine('hbs', handlebars({
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

/* function get user from request cookie */
function _getUserByCookie(_cookie) {
    stmt = "SELECT * FROM tbl_user WHERE cookie='" + _cookie +"'";
    var _nickname = false;
    db.all(stmt, [], (err, rows)=> {
        if (err) {
            return false;
        } else if (rows.length) {
            _nickname = rows[0].nickname.toString();
        } else  {
            return false;
        }
    });
    return _nickname;
};

/**
 * 
 * @param {*} req 
 * @returns : false if not request cookie else cookie name
 */
function _getRequestCookie(req) {
    if (!req.cookies[cookie_name]) {
        return false;
    } 
    return req.cookies[cookie_name];
}

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/home', (req, res)=> {
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.render('unauth');
    } 
    var params = [];
    var stmt = "SELECT id, nickname, username, email, address, description, date_login FROM tbl_user";
    db.all(stmt, params, (err, rows)=> {
        if (err) {
            return res.status(200).render(res_err, 
                {layout: 'main', error: err.message
            });
        }
        var _user_tbl = '';
        for (var i = 0; i < rows.length; i++) {
            var _row_data = rows[i];
            _user_tbl += '<tr>';
            _user_tbl += '<td style="width: 50px;">' + _row_data['id']+'</td>';
            _user_tbl += '<td>' + _row_data['nickname'] + '</td>';
            _user_tbl += '<td>' + _row_data['username'] + '</td>';
            _user_tbl += '<td>' + _row_data['email'] + '</td>';
            _user_tbl += '<td>' + _row_data['address'] + '</td>';
            _user_tbl += '<td>' + _row_data['description'] + '</td>';
            _user_tbl += '<td>' + _row_data['date_login'] +'</td>';
            _user_tbl += '</tr>'

        }
        res.render('home', {layout: 'main', users: _user_tbl});
    });
});

app.post('/api/v01/auth', (req, res, next) => {
    var errors = [];

    if (typeof req.query.nickname == undef || !req.query.nickname) {
        errors.push('No nickname specified');
    }
    if (typeof req.query.password == undef || !req.query.password) {
        errors.push('No password specified');
    }
    if (errors.length) {
        return res.status(400).json({res_stt: res_err, res_msg: errors.join(',')});
    }
    var nickname = req.query.nickname;
    var password = req.query.password;
    var stmt = "SELECT * FROM tbl_user WHERE nickname='" +nickname + "'" + "AND password='" + password +"'";
    var params = [];
    if (db.all(stmt, params, (err, rows) => {
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
                res_msg: err.message
            });
        } else if (rows.length) {
            var cookie = uuid.v1().toString();
            var date = new Date();
            
            stmt = "UPDATE tbl_user SET cookie='" +cookie +"'" +", date_login='" +date.toString() +"'" +"WHERE nickname='"+password+"'";
            db.run(stmt, params, (err)=> {
                if (err) {
                    return res.status(400).json({
                        res_stt: res_err, 
                        res_msg: err.message});
                } else {
                    res.cookie(cookie_name, cookie, {maxAge: 3600000});
                    return res.status(200).json({
                        res_stt: res_success, 
                        res_msg: 'Authentication Successed!'
                    });
                }
            });
        } else {
            return res.status(400).json({
                res_stt: res_err, res_msg: 
                'Authentication failure!'
            });
        }
    }));
})

app.get('/api/v01/logout', (req, res, next)=>{
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.status(400).json({
            res_stt: res_err,
            res_msg: 'User session not authorized.'
        });
    }

    var stmt = "SELECT * FROM tbl_user WHERE cookie='" + _cookie +"'";
    var _nickname;
    db.all(stmt, [], (err, rows) =>{
        if (err) {
            return res.render(res_err, 
                {layout: 'main', error: err.message
            });
        } else  if (rows.length){
            _nickname = rows[0]['nickname'];
        }
    });
    if (_nickname == '') {
        return res.status(400).json({
            res_stt: res_err,
            res_msg: 'Could not find specific user'
        });
    }

    stmt = "UPDATE tbl_user SET cookie=NULL WHERE nickname='" +_nickname +"'";
    var params = [];
    db.run(stmt, params, (err)=>{
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
                res_msg: err.message
            });
        }
        return res.status(200).json({
            res_stt: res_success, 
            res_msg: 'Logout Success.'
        });
    });

});


app.get('/api/v01/users', (req, res, next)=>{
    var stmt = 'SELECT nickname, password, username, email, address, description, date_login FROM tbl_user';
    var params = [];
    db.all(stmt, params, (err, rows) => {
        if (err) {
            return res.status(400).json({
                res_stt:res_err,
                'msg': err.message
            });
        } else {
            return res.json({
                res_stt:res_success,
                res_msg: 'select success',
                'data': rows
            });
        }
    });
})

// app.get('/api/v01/account', (req, res) =>{
//     var _cookie = _getRequestCookie(req);
//     if (!_cookie) {
//         return res.render('unauth');
//     } 
//     return res.render('account');
// });


app.post('/api/v01/accadd', (req, res) => {
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: 'User session not authorized.'
        });
    }

    var errors = [];
    if (!req.query['nickname']) {
        errors.push('Username not specified.');
    }
    if (!req.query['password']) {
        errors.push('Password not specified');
    }
    if (!req.query['username']) {
        errors.push('Username not specified');
    }
    if (!req.query['email']) {
        errors.push('Email address not specified');
    }
    if (!req.query['address']) {
        errors.push('Address not specified');
    }

    if (errors.length) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: errors.join(',')
        });
    }

    var stmt = "INSERT INTO tbl_user (nickname, password, username, email, address, description) VALUES (?,?,?,?,?,?)";
    var params = [req.query['nickname'], req.query['password'], req.query['username'], req.query['email'], req.query['address'], req.query['description']];
    db.run(stmt, params, (err)=> {
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
                res_msg: err.message
            });
        } else {
            return res.status(200).json({
                res_stt: res_success, 
                res_msg: res_success
            });
        }
    });

});


app.get('/api/v01/accedit', (req, res) => {
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: 'User session not authorized.'
        });
    }
    var edited = 0;
    var params = [];
    var stmt = "UPDATE tbl_user SET";
    if (typeof req.query.nickname == undef || !req.query.nickname) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: 'malformed request (00)'
        });
    }

    if (typeof req.query.password !== undef && req.query.password) {
        stmt += " password='" + req.query.password +"'";
        edited += 1;
    }

    if (typeof req.query.username !== undef && req.query.username) {
        if (!edited) {
            stmt += " username='" + req.query.username +"'";
        } else {
            stmt += ", username='" + req.query.username +"'";
        }
        edited += 1;
    }

    if (typeof req.query.email !== undef && req.query.email) {
        if (!edited) {
            stmt += " email='" + req.query.email +"'";
        } else {
            stmt += ", email='" + req.query.email +"'";
        }
        edited += 1;
    }

    if (typeof req.query.address !== undef && req.query.address) {
        if (!edited) {
            stmt += " address='" + req.query.address +"'";
        } else {
            stmt += ", address='" + req.query.address + "'";
        }
        edited += 1;
    }

    if (typeof req.query.description !== undef && req.query.description) {
        if (!edited) {
            stmt += " description='" + req.query.description+"'";
        } else {
            stmt += ", description='" + req.query.description+"'";
        }
    }
    stmt += " WHERE nickname='"+req.query.nickname +"'";
    db.run(stmt, params, (err)=> {
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
                res_msg: err.message
            });
        } else {
            return res.status(200).json({
                res_stt: res_success, 
                res_msg: 'update success'
            });
        }
    });
});

app.post('/api/v01/exec', (req, res) => {
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.status(400).json({
            res_stt: res_err,
            res_msg: 'User session not authorized'
        });
    } 
    if (!req.query['exec']) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: 'Unknown query'
        });
    }
    var command = 'ping -c4 ' + req.query['exec'];
    exec(command, (err, stdout, stderr)=> {
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
                res_msg: err.message
            });
        }
        return res.status(200).json({
            res_stt: res_success, 
            res_msg: res_success, 'data': stdout.toString()
        });
    });

});


app.delete('/api/v01/accdel', (req, res, next)=> {
    var _cookie = _getRequestCookie(req);
    if (!_cookie) {
        return res.status(400).json({res_stt: res_err, res_msg: 'user session not authorized'});
    }
    if (!req.query['nickname'] || (req.query['nickname'] && req.query['nickname']== '')) {
        return res.status(400).json({
            res_stt: res_err, 
            res_msg: 'malformed request'
        });
    }
    var _nickname = req.query['nickname'];
    stmt = `DELETE FROM tbl_user WHERE nickname='${_nickname}'`;
    var param = [];
    db.run(stmt, param, (err) => {
        if (err) {
            return res.status(400).json({
                res_stt: res_err, 
            res_msg: err.message
        });
        } else {
            return res.status(200).json({
                res_stt: res_success, 
            res_msg:'delete user successfuly'
        });
        }
    });
});
app.listen(port, () => {
    console.log('*********************************************************************');
    console.log('* WELCOME TO TECHHORIZON CORP                                       *');
    console.log(`* Welcome to Techhorizon! server listening http://localhost:${port}    *`);
    console.log('* Application Started.                                              *');
    console.log('*********************************************************************');
});