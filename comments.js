// Create web server
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../db');
var moment = require('moment');
var multer = require('multer');
var upload = multer({
    dest: 'public/images/'
});
var fs = require('fs');
var auth = require('../auth');

// Function: get all comments
// Input: none
// Output: all comments
router.get('/', function(req, res, next) {
    db.query('SELECT * FROM comments', function(err, rows) {
        if (err) {
            res.status(500).send({
                error: 'Something failed!'
            });
        } else {
            res.json(rows);
        }
    });
});

// Function: create new comment
// Input: comment info
// Output: new comment
router.post('/', auth.checkAuth, upload.single('file'), function(req, res, next) {
    var comment = req.body;
    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    var file = req.file;
    var comment = {
        content: req.body.content,
        date: date,
        user_id: req.body.user_id,
        post_id: req.body.post_id,
        file_id: null
    };
    if (file) {
        db.query('INSERT INTO files SET ?', {
            name: file.filename,
            path: file.path,
            type: file.mimetype,
            size: file.size
        }, function(err, result) {
            if (err) throw err;
            comment.file_id = result.insertId;
            db.query('INSERT INTO comments SET ?', comment, function(err, result) {
                if (err) throw err;
                db.query('SELECT * FROM comments WHERE id = ?', result.insertId, function(err, rows) {
                    if (err) throw err;
                    res.json(rows);
                });
            });
        });
    } else {
        db.query('INSERT INTO comments SET ?', comment, function(err, result) {
            if (err) throw err;
            db.query('SELECT * FROM comments WHERE id = ?', result.insertId, function(err, rows) {
                if (err) throw err;
                res.json(rows);
            });
        });
    }
});

// Function: get comment by id
// Input: comment id
// Output: comment
router.get('/:id', function(req, res, next) {
    db.query