# WPM Web PM2 Manager
Simple web based application to manage PM2 processes

# How to install
1. make sure you have nodejs and npm installed
2. create the app directory and navigate to it
    ```
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www
    cd /var/www
    ```
3. clone this repo
    ```
    git clone https://github.com/mriza/wpm.git
    cd wpm
    ```
4. Install Dependencies
    ```
    npm install
    ```
5. verify if application runs locally
    ```
    node app.js
    ```
    Visit the app in your browser at:
    ```
    http://<server-ip>:3000
    ```
6. start with pm2
    ```
    pm2 start app.js --name "WPM PM2 Manager"
    ```
7. save the process list
    ```
    pm2 save
    ```
8. follow the instruction to enable the service integrate with systemd.
9. you can install reversed proxy like to serve the app to HTTP port or even set up HTTPS with it.