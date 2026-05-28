require('dotenv').config();

const express = require('express');

const path = require('path');

const session = require('express-session');

const passport = require('passport');

const SteamStrategy = require('passport-steam').Strategy;

const app = express();

/* SESSION */

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        maxAge: 1000 * 60 * 60 * 24 * 365 * 10

    }

}));

/* PASSPORT */

app.use(passport.initialize());

app.use(passport.session());

/* STATIC FILES */

app.use(express.static(path.join(__dirname, 'public')));

/* SERIALIZE */

passport.serializeUser((user, done) => {

    done(null, user);

});

passport.deserializeUser((user, done) => {

    done(null, user);

});

/* STEAM LOGIN */

passport.use(new SteamStrategy({

        returnURL: 'https://multiwars-site.onrender.com/auth/steam/return',

        realm: 'https://multiwars-site.onrender.com/',

        apiKey: process.env.STEAM_API_KEY

    },

    async function(identifier, profile, done) {

        try {

            return done(null, {

                steamid: profile.id,

                username: profile.displayName,

                avatar: profile.photos[2].value

            });

        } catch(error){

            console.log(error);

            return done(error);

        }

    }

));

/* HOME */

app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'index.html'));

});

/* STEAM AUTH */

app.get('/auth/steam',

    passport.authenticate('steam')
);

/* STEAM RETURN */

app.get('/auth/steam/return',

    passport.authenticate('steam', {

        failureRedirect: '/'

    }),

    function(req, res){

        res.redirect('/profile');

    }

);

/* PROFILE PAGE */

app.get('/profile', (req, res) => {

    if(!req.user){

        return res.redirect('/auth/steam');

    }

    res.sendFile(path.join(__dirname, 'public', 'profile.html'));

});

/* SCREENSHOTS */

app.get('/screenshots.html', (req, res) => {

    res.sendFile(

        path.join(__dirname, 'public', 'screenshots.html')

    );

});

/* API PLAYER */

app.get('/api/player', async (req, res) => {

    if(!req.user){

        return res.status(401).send('Не авторизован');

    }

    res.json({

        username: req.user.username,

        steamid: req.user.steamid,

        avatar: req.user.avatar,

        kills: 0,

        hours: 0,

        vehicles_destroyed: 0,

        aircraft_destroyed: 0

    });

});

/* START SERVER */

app.listen(3000, () => {

    console.log('SERVER WORKING ON 3000');

});
```
