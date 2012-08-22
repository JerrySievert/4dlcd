# 4D SGC/Picasso LCD Controller for Node.js

This is an experimental library: an ever-growing implementation of the 4D Systems SGC/Picasso protocol.  See http://www.4dsystems.com.au/prod.php?id=113 and http://www.4dsystems.com.au/downloads/Semiconductors/PICASO-SGC/Docs/PICASO-SGC-COMMANDS-SIS-rev11.pdf

## Installing

    $ npm install 4dlcd

## Using It

    var 4dlcd = require('4dlcd').Device;
    var SerialPort = require('serialport').SerialPort;
    
    var port = new SerialPort('/dev/ttyUSB1', { baudrate: 9600 });
    var lcd = new 4dlcd(port);
    
    lcd.autobaud();
    
    // draw a red rectangle from 0,0 to 10,10
    lcd.drawRectangle(0, 0, 10, 10, 255, 0, 0);

## Documentation

This module serves as a buffered thin wrapper around the underlying protocol.  It handles `RGB` conversion as well as buffering commands in order to stop packet collisions.

Since commands are queued, callbacks are optional.  If none is passed, a default callback will be used.  Code is still executed asynchronously, so multiple commands can be executed and the callback sent with the final command will be called when completed.

### Constructor

Instantiate a new instance of the display.  The parameter passed should be a connected `SerialPort`.

#### Example

    var port = new SerialPort('/dev/ttyUSB1', { baudrate: 9600 });
    var lcd = new 4dlcd(port);

### autobaud(/* optional callback */)

Autobaud is the initialization command and must be called before any other command can be called.

#### Example

    lcd.autobaud(function (err, status) {
      console.dir(status); // Buffer <0x06>
    });

### version(/* optional callback */)

Version returns a Buffer containing the version information of the connected device:

* device_type
** 0x01 = micro-LCD.
** 0x02 = micro-VGA.
* hardware_rev
* firmware_rev
* horizontal_res
  * 0x28 : 128 pixels
  * 0x32: 320 pixels
  * 0x60 : 160 pixels
  * 0x64 : 64 pixels
  * 0x76 : 176 pixels
  * 0x96 : 96 pixels
  * 0xFF : Unknown
* vertical_res
  * 0x22 : 220 pixels
  * 0x24 : 240 pixels
  * 0x28 : 128 pixels
  * 0x32 : 320 pixels
  * 0x60 : 160 pixels
  * 0x64 : 64 pixels
  * 0x76 : 176 pixels
  * 0x96 : 96 pixels
  * 0xFF : Unknown

### replaceBackgroundColour(r, g, b, /* optional callback */)

Changes the background color of the screen immediately.

#### Example

    lcd.replaceBackgroundColour(255, 0, 0, function (err, status) {
      console.dir(status); // Buffer <0x06>
    });

### clearScreen(/* optional callback */)

Clears the screen.

#### Example

    lcd.clearScreen(function (err, status) {
      console.dir(status); // Buffer <0x06>
    });

### controlFunction(mode, value, /* optional callback */)

Sends a control function to the screen.

### drawImage65k(x, y, width, height, data, /* optional callback */)

Draws an image, specified in the data argument (16bit - 565 format) at the x and y coordinates specified.

#### Example

    lcd.drawImage65k(0, 0, 1, 2, new Buffer([ 0xff, 0xff, 0xff, 0xff ]));

