const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const PM2 = require('/usr/local/lib/node_modules/pm2');
const authenticateLinuxUser = require('./utils/authenticateLinuxUser');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'lskk-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

// Passport Configuration
passport.use(new LocalStrategy((username, password, done) => {
    authenticateLinuxUser(username, password, (isValid) => {
        if (!isValid) return done(null, false, { message: 'Invalid credentials' });
        return done(null, { username });
    });
}));
passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser((username, done) => done(null, { username }));

// Authentication Middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Routes
app.get('/login', (req, res) => res.render('login', { title: 'Login - LSKK PM2 Manager' }));

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/login'));
});

app.get('/', ensureAuthenticated, (req, res) => {
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.list((err, processList) => {
            if (err) return res.send('Error fetching PM2 processes');
            PM2.disconnect();
            res.render('processes', { title: 'LSKK PM2 Manager', processes: processList });
        });
    });
});

app.get('/process/:id', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.describe(processId, (err, processDescription) => {
            if (err) return res.send('Error fetching process details');
            PM2.disconnect();
            res.render('process-details', { title: 'Process Details', process: processDescription[0] });
        });
    });
});

app.post('/process/:id/start', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.start(processId, (err) => {
            if (err) return res.send('Error starting process');
            PM2.disconnect();
            res.redirect(`/process/${processId}`);
        });
    });
});

app.post('/process/:id/stop', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.stop(processId, (err) => {
            if (err) return res.send('Error stopping process');
            PM2.disconnect();
            res.redirect(`/process/${processId}`);
        });
    });
});

app.post('/process/:id/restart', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.restart(processId, (err) => {
            if (err) return res.send('Error restarting process');
            PM2.disconnect();
            res.redirect(`/process/${processId}`);
        });
    });
});

app.post('/process/:id/reload', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.reload(processId, (err) => {
            if (err) return res.send('Error reloading process');
            PM2.disconnect();
            res.redirect(`/process/${processId}`);
        });
    });
});

app.post('/process/:id/delete', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.delete(processId, (err) => {
            if (err) return res.send('Error deleting process');
            PM2.disconnect();
            res.redirect('/');
        });
    });
});




const PORT = 3000;
app.listen(PORT, () => console.log(`LSKK PM2 Manager running on http://localhost:${PORT}`));
