const { io } = require('socket.io-client');
const { SerialPort, ReadlineParser } = require('serialport');
const { exec } = require('child_process');
const path = require('path');

const SERVER_URL = 'https://qr-door-lock-923b9e990317.herokuapp.com';
const DEVICE_ID = "MY_LAPTOP_1";
const SERIAL_PATH = "COM5";
const BAUD_RATE = 9600;
const QR_IMAGE_PATH = path.join(__dirname, 'QRLock.png');

const socket = io(SERVER_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true 
});

// laptopClient.js 맨 위에 넣으세요

SerialPort.list().then(ports => {
  console.log("=== Available Serial Ports ===");
  ports.forEach(port => console.log(port.path));
  console.log("================================");
}).catch(err => {
  console.error("Error listing ports:", err);
});


socket.on("connect", () => {
    console.log(`connected to server at ${SERVER_URL}`);
    socket.emit("register_device", { device_id: DEVICE_ID });
    console.log(`registered device: ${DEVICE_ID}`);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

socket.on("unlock", ({ code }) => {
    console.log(`UnLock signal received (code- ${code})`);
    port.write("UNLOCK\n", (err) => {
        if (err) copnsole.error("Serial write error:", err);
        else     console.log("Sent UNLOCK to Arduino");
    });
});

socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err);
});
socket.on('connect_timeout', () => {
    console.error('Socket connect_timeout');
});
socket.on('reconnect_failed', () => {
    console.error('Socket reconnect_failed');
});


const port = new SerialPort({
    path: SERIAL_PATH,
    baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n"}));

port.on("open", () => {
    console.log(`Serial port ${SERIAL_PATH} opened at ${BAUD_RATE} baud`);
});

parser.on("data", (line) => {
    const msg = line.trim();
    console.log(msg);
    if (msg === "SHOW_QR") {
        console.log("SHOW_QR received -> displaying QR");
        showQR();
    } else {
        console.log("Serial data:", msg);
    }
});

port.on("error", (err) => {
    console.error("Serial port error:", err);
});


const showQR = () => {
    // const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    // exec(`${opener} "${QR_IMAGE_PATH}"`, (err) => {
    //     if(err) {
    //         console.error("Error opening QR code image:", err);
    //     }
    // })
    let cmd;
    if(process.platform === "win32") {
        cmd = `start "" "${QR_IMAGE_PATH}"`;
    } else if (process.platform === "darwin") {
        cmd = `open "${QR_IMAGE_PATH}"`;
    } else {
        cmd = `xdg-open "${QR_IMAGE_PATH}"`;
    }
    exec(cmd, (err) => {
        if (err) console.error("QR display error:", err);
    });
    
}

socket.on("error", (err) => console.error("Socket error", err));
console.log("Socket.io client initialized");