const { exec } = require('child_process');

const authenticateLinuxUser = (username, password, callback) => {
    exec(`echo '${password}' | sudo -S -u ${username} whoami`, (error, stdout) => {
        if (error) {
            return callback(false);
        }
        callback(stdout.trim() === username);
    });
};

module.exports = authenticateLinuxUser;
