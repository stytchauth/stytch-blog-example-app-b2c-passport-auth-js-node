const express = require("express");
const stytchClient = require("../auth/stytch-config");
const router = express.Router();

module.exports = function(passport) {
    router.post("/login-or-register", passport.authenticate('stytch-strategy', { failureRedirect: "/", failureFlash: true }), async (req, res) => {
        res.redirect('/');
    });
    
    router.get("/authenticate", passport.authenticate('stytch-strategy', { action: "authenticateMagicLink" ,failureRedirect: "/", failureFlash: true } ), async (req, res) => {
        res.redirect("/profile");
    });

    router.get("/profile", passport.authenticate('stytch-strategy', { action: "authenticateSessionJWT" ,failureRedirect: "/", failureFlash: true } ), async (req, res) => { 
        res.render('profile', { user: req.user });
    });

    router.post("/update-profile", passport.authenticate('stytch-strategy', { action: "authenticateSessionJWT", failureRedirect: "/", failureFlash: true }), async (req, res) => {
        try {
            await stytchClient.users.update({
                user_id: req.user.user_id,
                name: {
                    first_name: req.body.first_name,
                }
            });
        } catch (error) {
            console.error(error);
            req.flash("error", "Failed to update profile: " + error.message);
        }
        
        res.redirect("/profile");
    });

    router.post("/logout", (req, res) => {
        req.logout(function(err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });
    return router;
};