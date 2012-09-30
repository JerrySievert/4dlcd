var SerialPort = require('serialport').SerialPort,
    fourd      = require('../device').Device;

var serialPort = new SerialPort('/dev/tty.SLAB_USBtoUART', { baudrate: 115200 });
    
if (serialPort) {
  var lcd = new fourd(serialPort);
  
  lcd.autobaud();
  lcd.clearScreen();
}
