const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv").config();
const Notes = require("./models/NotesModel.js");
const cookieParser = require("cookie-parser");
const db = require("./db.js");
const bcrypt = require("bcrypt");
const User = require("./models/UserModel.js");
const flash = require("connect-flash");
const expressSession = require("express-session");

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Uncomment if using cookies
// app.use(express.session({
//     cookie: {
//       path    : '/',
//       httpOnly: false,
//       maxAge  : 24*60*60*1000
//     },
//     secret: '1234567890QWERT'
//   }));
app.use(
  cors({
    origin: ["http://localhost:5173", "https://notes-app-3112.vercel.app"],
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.express_session,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(flash());

// Routes
app.get("/", (req, res) => {
  res.send("hey ya");
});

app.post("/view-note/:noteId", async (req, res) => {
  const noteId = req.params.noteId;
  const usersId = req.body.id;
  try {
    const note = await Notes.findOne({ _id: noteId });
    if (note) {
      console.log("note is:", note);
      console.log("note.userId = ", note.userId);
      console.log("actual user id:", usersId);
      if (note.userId == usersId) {
        console.log("creator is viewing...");
        res.json({ msg: "Success", data: note });
      } else {
        if (note.isShareable) {
          res.json({ msg: "Success 2", data: note });
        } else {
          res.json({
            msg: "Failure",
            desc: "Sorry, this note is not shareable.",
          });
        }
      }
    }
  } catch (err) {
    console.log(err.message);
    res.send(`Error occured:${err.message}`);
  }
});

app.post("/update-note/:id", async (req, res) => {
  const id = req.params.id;
  const { title, desc, isShareable } = req.body;
  console.log("update:", req.body);
  try {
    const note = await Notes.findOneAndUpdate(
      { _id: id },
      { title, desc, isShareable, createdAt: Date.now() },
      { new: true }
    );
    console.log("inside update note:", note);
    res.json({ msg: "Success", data: note });
  } catch (err) {
    res.send(`Failure in note updating:${err.message}`);
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    req.flash("User", email); // Store email in flash
    res.json({ msg: "User created", email: req.flash("User") });
  } catch (err) {
    res.status(500).send("Error in registering user: " + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ msg: "User not found!!" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.email = email;
      res.cookie("user-cookie", user._id, {
        maxAge: 3600000,
        httpOnly: true,
        secure: true,
        sameSite: 'None',
      });
      res.json({ msg: "Login success", user: user._id });
    } else {
      res.json({ msg: `Password doesn't match` });
    }
  } catch (err) {
    res.status(500).send("Internal server error: " + err.message);
  }
});

app.post("/create-note/:id", async (req, res) => {
  const id = req.params.id;
  console.log("id is:", id);
  var { title, desc, shareable } = req.body;
  if (shareable == "on") shareable = true;
  else shareable = false;
  console.log(req.body);
  try {
    const notes = new Notes({
      userId: id,
      title,
      desc,
      isShareable: shareable,
    });
    await notes.save();
    res.send({ msg: "Success", data: notes });
  } catch (err) {
    res.send(`Error:${err.message}`);
  }
});

app.get("/home/:id", async (req, res) => {
  const id = req.params.id;
  console.log("inside home:", id, " and type of is is:", typeof id);
  try {
    const user = await User.findOne({ _id: id });
    // const note = await Notes.findOne({ _id: noteId });
    const notes = await Notes.find({ userId: id });
    console.log("notes:", notes);
    console.log("user._id is:", user._id, " and its type is:", typeof user._id);
    console.log("notes.userId:", notes.userId);
    if (user && notes) {
      const { name, email } = user;
      res.json({ id: id, name: name, email: email, notes: notes });
    } else res.send("Please login to continue");
  } catch (err) {
    console.log(err.message);
    res.send(`Error is in home route:${err.message}`);
  }
});

app.post("/profile-update/:id", async (req, res) => {
  const id = req.params.id;
  const { name, email, phone } = req.body;
  console.log("inside profile update:", req.body);
  try {
    const user = await User.findOneAndUpdate(
      { _id: id },
      { name, email },
      { new: true }
    );
    res.json({ msg: "Success", data: user });
  } catch (err) {
    console.log(err.message);
    res.json({ msg: "Failure", data: err.message });
  }
});

app.post("/user-details/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id });
    res.json({ msg: "Success", data: user });
  } catch (err) {
    res.json({ msg: "Failure", data: err.message });
  }
});

app.post("/delete-note/:id", async (req, res) => {
  console.log("entered into delete note");
  const id = req.params.id;
  try {
    const data = await Notes.findOneAndDelete({ _id: id });
    res.json({ msg: "Deleted note", data: data });
  } catch (error) {
    res.send(`Error occured in deleting note:${error.message}`);
  }
});
app.post("/logout", (req, res) => {
  console.log("before logout:", req.cookies);
  //   console.log("logout route");
  try {
    res.clearCookie("user-cookie", { path: "/" });
    res.send("Success");
  } catch (err) {
    res.send(err.message);
  }
  console.log("after logout:", req.cookies);
});
app.get("/", (req, res) => {
  res.send("WORKING.....");
});
app.get("/", (err, req, res, next) => {
  res.send("Oops,  some error occured:", err);
});
app.listen(3001, () => {
  console.log("Server listening on port 3001");
});
module.exports = app;
