const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("../database");
var session = require("express-session");
const cookieParser = require("cookie-parser");
var path = require("path");
var fs = require("fs");
const router = express.Router();
const app = express();
const multer = require("multer");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "thisismysecretekey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(cookieParser());
app.use(express.static("public"));

const userSchema = {
  username: String,
  password: String,
};

const videoSchema = {
  video: {
    data: Buffer,
    contentType: String,
  },
  username: String,
};

const Video = mongoose.model("video", videoSchema);

const User = mongoose.model("User", userSchema);

router.get("/", function (req, res) {
  res.render("starting-page");
});

router.get("/signup", function (req, res) {
  res.render("sign-up-page");
});

router.get("/home", function (req, res) {
  
    res.render("home-page", { username: session.userid });
  
});

router.get("/videos", function (req, res) {
  Video.find({ username: session.userid }, (err, items) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred", err);
    } else {
      res.render("my-videos", {
        username: session.userid,
        items: items,
      });
    }
  });
});

router.post("/signup", async function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirm;
  var data = {
    username: username,
    password: password,
  };
  const existUsername = await User.findOne({ username: username });
  if (username === "" || password === "") {
    const message = "Username and password cannot be empty";
    res.render("sign-up-page", {
      message: message,
    });
  } else if (password !== confirmPassword) {
    const message = "password does not match with the confirm password";
    res.render("sign-up-page", {
      message: message,
    });
  } else if (existUsername) {
    const message = "Username already exists in database";
    res.render("sign-up-page", {
      message: message,
    });
  } else {
    User.insertMany(data, function (err) {
      if (err) {
        console.log(err);
        res.render("sign-up-page");
      } else {
        const message = "Successfully Signed up, please sign in";
        res.render("starting-page", {
          message: message,
        });
      }
    });
  }
});

router.post("/signin", async function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (username === "" || password === "") {
    const message = "Username and password cannot be empty";
    res.render("starting-page", {
      message: message,
    });
  }

  const foundUser = await User.findOne({
    username: username,
    password: password,
  });
  if (foundUser !== null) {
    session = req.session;
    session.userid = req.body.username;
    res.render("home-page", { username: session.userid });
  } else {
    const message = "Invalid Username or Password";
    res.render("starting-page", {
      message: message,
    });
  }
});

router.post("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

router.post("/upload", upload.single("video"), function (req, res) {
  var video = fs.readFileSync(req.file.path);
  var encode_video = video.toString("base64");

  var obj = {
    video: {
      data: new Buffer.alloc(10000000, encode_video, "base64"),
      contentType: req.file.mimetype,
    },
    username: session.userid,
  };

  Video.create(obj, (err, item) => {
    if (err) {
      console.log(err);
    } else {
      const message = "Video uploaded successfully";
      res.render("home-page", {
        username: session.userid,
        message: message,
      });
    }
  });
});

module.exports = router;
