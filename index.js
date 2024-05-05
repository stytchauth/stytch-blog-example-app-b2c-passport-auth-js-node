require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const session = require("express-session");
const flash = require('connect-flash');
const passport = require("passport");
const StytchAuthStrategy = require("./auth/stytch-auth-strategy");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {  maxAge: null, sameSite: false }
  })
);

app.set('view engine', 'ejs');
app.set('views', './views');

// Define the Stytch strategy
passport.use("stytch-strategy", new StytchAuthStrategy());

// Initialize passport
app.use(passport.initialize());

// Use the express session
app.use(passport.session());

// Serialize and deserialize the user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const authRouter = require("./routes/auth-routes")(passport);
// Use the authRouter
app.use(authRouter);

app.use(function(req, res, next){
    res.locals.message = req.flash();
    next();
});

app.get("/", (req, res) => {
    res.render("index");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});