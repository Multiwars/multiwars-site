require('dotenv').config();

const express = require('express');

const path = require('path');

const session = require('express-session');

const passport = require('passport');

const SteamStrategy = require('passport-steam').Strategy;

const { Pool } = require('pg');

const app = express();

/* POSTGRESQL */

const pool = new Pool({

    user: 'postgres',

    host: 'localhost',

    database: 'multiwars',

    password: 'Nsujdyj123',

    port: 5432,

});

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

        returnURL: 'http://localhost:3000/auth/steam/return',

        realm: 'http://localhost:3000/',

        apiKey: process.env.STEAM_API_KEY

    },

    async function(identifier, profile, done) {

        try {

            const steamid = profile.id;

            const username = profile.displayName;

            const avatar = profile.photos[2].value;

            /* ИЩЕМ USER */

            const existingUser = await pool.query(

                'SELECT * FROM users WHERE steamid = $1',

                [steamid]

            );

            /* СОЗДАЕМ ЕСЛИ НЕТ */

            if(existingUser.rows.length === 0){

                await pool.query(

                    `INSERT INTO users
                    (
                        steamid,
                        username,
                        avatar
                    )

                    VALUES ($1, $2, $3)`,

                    [
                        steamid,
                        username,
                        avatar
                    ]

                );

            }

            /* SESSION USER */

            return done(null, {

                steamid,

                username,

                avatar

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

    try {

        const result = await pool.query(

            'SELECT * FROM users WHERE steamid = $1',

            [req.user.steamid]

        );

        res.json(result.rows[0]);

    } catch(error){

        console.log(error);

        res.status(500).send('Ошибка PostgreSQL');

    }

});

/* START SERVER */

app.listen(3000, () => {

    console.log('SERVER WORKING ON 3000');

});