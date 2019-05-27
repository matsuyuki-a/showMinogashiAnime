"use strict";
const Express = require("express");
const BodyParser = require('body-parser');
const Sequelize = require('sequelize');
const AnimeReview = require('./model/animeReview.js');
const app = Express();

const db = {
  name: 'anime',
  user: process.env.ANIME_DB_USER_NAME,
  pass: process.env.ANIME_DB_PASS,
  host: 'localhost',
  dialect: 'mysql'
};

if(db.user == null || db.pass == null){
  console.log("ENV:DB_UASENAME or DB_PASS is null");
  return;
}

const sequelize = new Sequelize(db.name, db.user, db.pass, {
  host: db.host,
  dialect: db.dialect
});

let animeReview = new AnimeReview(sequelize);

// urlencodedとjsonは別々に初期化する
app.use(BodyParser.urlencoded({
    extended: true
}));
app.use(BodyParser.json());

let server = app.listen(3333, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

app.get("/test", (req, res)=>{
  res.header('Content-Type', 'application/json');
  let res_body = { status: 'ok' };
  res.send(res_body);
});

app.get("/getAnimeReview", (req, res)=>{
  animeReview.model.findAll({
    where: {
      tid: 392
    }
  })
  .then((res_body)=>{
    res.header('Content-Type', 'application/json');
    res.send(res_body);
  })
});
