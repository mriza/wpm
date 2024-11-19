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

// Start process
app.post('/process/:id/start', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.start(processId, (err) => {
            PM2.disconnect();
            res.redirect('/'); // Redirect to process list
        });
    });
});

// Stop process
app.post('/process/:id/stop', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.stop(processId, (err) => {
            PM2.disconnect();
            res.redirect('/'); // Redirect to process list
        });
    });
});

// Restart process
app.post('/process/:id/restart', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.restart(processId, (err) => {
            PM2.disconnect();
            res.redirect('/'); // Redirect to process list
        });
    });
});

// Reload process
app.post('/process/:id/reload', ensureAuthenticated, (req, res) => {
    const processId = req.params.id;
    PM2.connect((err) => {
        if (err) return res.send('Error connecting to PM2');
        PM2.reload(processId, (err) => {
            PM2.disconnect();
            res.redirect('/'); // Redirect to process list
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

app.get('/api/processes', ensureAuthenticated, (req, res) => {
    PM2.connect((err) => {
        if (err) return res.status(500).json({ error: 'Error connecting to PM2' });
        PM2.list((err, processList) => {
            if (err) return res.status(500).json({ error: 'Error fetching processes' });
            PM2.disconnect();
            res.json(processList); // Return the updated process list as JSON
        });
    });
});

app.get('/process/:id/log', ensureAuthenticated, (req, res) => {
    const processId = req.params.id; // Extract process ID from the URL

    PM2.connect((err) => {
        if (err) return res.status(500).send('Error connecting to PM2');

        PM2.describe(processId, (err, processDescription) => {
            if (err || !processDescription[0]) {
                PM2.disconnect();
                return res.status(404).send('Process not found');
            }

            const outLogPath = processDescription[0]?.pm2_env.pm_out_log_path || null;
            const errLogPath = processDescription[0]?.pm2_env.pm_err_log_path || null;

            const outLogContent = outLogPath && fs.existsSync(outLogPath)
                ? fs.readFileSync(outLogPath, 'utf8')
                : 'No out log available';

            const errLogContent = errLogPath && fs.existsSync(errLogPath)
                ? fs.readFileSync(errLogPath, 'utf8')
                : 'No error log available';

            PM2.disconnect();

            res.render('process-log', {
                title: 'Process Logs',
                process: processDescription[0],
                outLogContent,
                errLogContent
            });
        });
    });
});



const PORT = 3000;
app.listen(PORT, () => console.log(`LSKK PM2 Manager running on http://localhost:${PORT}`));
