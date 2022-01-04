const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var session = require('express-session');
const cookieParser = require("cookie-parser");


const app = express();
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(session({
  secret: 'thisismysecretekey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(cookieParser());
app.use(express.static("public"));


app.use("/", require("./routes/routes"));



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started");
});
