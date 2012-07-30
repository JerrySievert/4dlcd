var util      = require('util'),
    events    = require('events');


function rgbToBuffer (r, g, b) {
  return int16ToBuffer(((r>>3)<<11)+((g>>2)<<5)+(b>>3));
}

function int16ToBuffer (value) {
  var buffer = new Buffer(2);
  
  buffer[0] = Math.floor(Number(value / 256));
  buffer[1] = Math.floor(Number(value % 256));

  return buffer;
}

function Device (serialPort) {
  this.serialPort = serialPort;
  this.callbacks  = [ ];
  this.waitfor    = [ ];
  this.commands   = [ ];
  this.current    = 0;
  this.buffer     = new Buffer(1024);
  var self = this;

  serialPort.on('data', function parse (data) {
    console.dir(data);
    for (var i = 0; i < data.length; i++) {
      self.buffer[self.current] = data[i];
      self.current++;
    }

/*    if (self.waitfor.length === 0) {
      console.warn("received spurious data");
      console.dir(data);
      return;
    }
*/
    var waitfor = self.waitfor.shift();
    if (self.current < waitfor) {
      self.waitfor.unshift(waitfor);
      return;
    }
    
    var tmpBuf = self.buffer.slice(0, waitfor);


    var cb = self.callbacks.shift();
    if (cb) {
      cb(undefined, tmpBuf);
    }

    if (self.current > waitfor) {
      // will this ever be called? if so, need to implement reseting the buffer
      var tmpBuf = self.buffer.slice(self.current);
      self.current = 0;
      parse(tmpBuf);
      //serialPort.emit('data', tmpBuf);
      return;
    }
    self.current = 0;
    self.emit('response');
  });
  
  self.on('response', function () {
    if (self.commands.length) {
      var command = self.commands.shift();
      self.callbacks.push(command.callback);
      self.waitfor.push(command.waitfor);
      self.serialPort.write(command.buffer);
    }
  });
}

util.inherits(Device, events.EventEmitter);

Device.MODE_BACKLIGHT   = 0;
Device.MODE_DISPLAY     = 1;
Device.MODE_CONTRAST    = 2;
Device.MODE_POWER       = 3;
Device.MODE_ORIENTATION = 4;
Device.MODE_TOUCH       = 5;
Device.MODE_IMAGEFORMAT = 6;
Device.MODE_PROTECT_FAT = 8;

// backlight
Device.BACKLIGHT_OFF    = 0;
Device.BACKLIGHT_ON     = 1;

// display
Device.DISPLAY_OFF      = 0;
Device.DISPLAY_ON       = 1;

// power
Device.SHUTDOWN         = 0;
Device.POWERUP          = 1;

// orientation
Device.LANDSCAPE        = 1;
Device.LANDSCAPE_R      = 2;
Device.PORTRAIT         = 3;
Device.PORTRAIT_R       = 4;

// touch
Device.ENABLE_TOUCH     = 0;
Device.DISABLE_TOUCH    = 1;
Device.RESET_TOUCH      = 2;

// image
Device.NEW_FORMAT       = 0;
Device.OLD_FORMAT       = 1;

// fat
Device.PROTECT          = 0;
Device.UNPROTECT        = 2;

// baud rates
Device.BAUD_9600        = 6;
Device.BAUD_19200       = 8;
Device.BAUD_57600       = 0x0c;
Device.BAUD_115200      = 0x0d;
Device.BAUD_128000      = 0x0e;
Device.BAUD_256000      = 0x0f;

// pen size
Device.PEN_SOLID        = 0;
Device.PEN_LINE         = 1;

Device.prototype.queue = function (command) {
  if (this.commands.length === 0) {
    this.callbacks.push(command.callback);
    this.waitfor.push(command.waitfor);
    this.serialPort.write(command.buffer);
  } else {
    this.commands.push(command);
  }
};

Device.prototype.defaultCallback = function (err, data) {
  console.dir(data);
};

Device.prototype.autobaud = function (callback) {
  this.directWrite(callback, 1, [ 0x55 ]);
};

Device.prototype.setBaudRate = function (baud, callback) {
  this.directWrite(callback, 1, [ 0x51, baud ]);
};

Device.prototype.version = function (callback) {
  this.directWrite(callback, 5, [ 0x56, 1 ]);
};

Device.prototype.replaceBackgroundColour = function (r, g, b, callback) {
  var color = rgbToBuffer(r, g, b);
  this.directWrite(callback, 1, [ 0x42, color[0], color[1] ]);
};

Device.prototype.setBackgroundColour = function (r, g, b, callback) {
  var color = rgbToBuffer(r, g, b);
  this.directWrite(callback, 1, [ 0x4b, color[0], color[1] ]);
};

Device.prototype.clearScreen = function (callback) {
  this.directWrite(callback, 1, [ 0x45 ]);
};

Device.prototype.controlFunction = function (mode, value, callback) {
  this.directWrite(callback, 1, [ 0x59, Number(mode), Number(value) ]);
};

Device.prototype.directWrite = function (callback, waitfor, command) {
  //this.callbacks.push(callback);
  //this.waitfor.push(waitfor);

  this.queue({ callback: callback, waitfor: waitfor, buffer: new Buffer(command) });
};

Device.prototype.drawImage65k = function (x, y, w, h, data, callback) {
  var command = new Buffer(data.length + 10);
  
  var bx = int16ToBuffer(x);
  var by = int16ToBuffer(y);
  var bh = int16ToBuffer(h);
  var bw = int16ToBuffer(w);

  command[0] = 0x49;
  command[1] = bx[0];
  command[2] = bx[1];
  command[3] = by[0];
  command[4] = by[1];
  command[5] = bw[0];
  command[6] = bw[1];
  command[7] = bh[0];
  command[8] = bh[1];
  command[9] = 0x10;

  for (var i = 0; i < data.length; i++) {
    command[i + 10] = data[i];
  }
  
  this.directWrite(callback, 1, command);
};

Device.prototype.drawCircle = function (x, y, radius, r, g, b, callback) {
  var x2 = int16ToBuffer(x);
  var y2 = int16ToBuffer(y);
  var r2 = int16ToBuffer(radius);
  var c = rgbToBuffer(r, g, b);

  this.directWrite(callback, 1, [ 0x43, x2[0], x2[1], y2[0], y2[1], r2[0], r2[1], c[0], c[1] ]);
};

Device.prototype.drawRectangle = function (x1, y1, x2, y2, r, g, b, callback) {
  x1 = int16ToBuffer(x1);
  x2 = int16ToBuffer(x2);
  y1 = int16ToBuffer(y1);
  y2 = int16ToBuffer(y2);
  var c = rgbToBuffer(r, g, b);

  this.directWrite(callback, 1, [ 0x72, x1[0], x1[1], y1[0], y1[1], x2[0], x2[1], y2[0], y2[1], c[0], c[1] ]);
};

Device.prototype.setPenSize = function (pen, callback) {
  this.directWrite(callback, 1, [ 0x70, pen ]);
};

Device.prototype.drawStringOfAsciiText = function (column, row, font, r, g, b, string, callback) {
  var c = rgbToBuffer(r, g, b);
  var cmd = [ 0x73, column, row, font, c[0], c[1] ];
  for (var i = 0; i < string.length; i++) {
    cmd.push(string.charCodeAt(i));
  }
  cmd.push(0);

  this.directWrite(callback, 1, cmd);
};

Device.prototype.drawImageIconFromCard = function (filename, x, y, callback) {
  var x1 = int16ToBuffer(x);
  var y1 = int16ToBuffer(y);

  var cmd = [ 0x40, 0x6d ];
  for (var i = 0; i < filename.length; i++) {
    cmd.push(filename.charCodeAt(i));
  }
  cmd.push(0);
  
  cmd.push(x1[0]);
  cmd.push(x1[1]);
  cmd.push(y1[0]);
  cmd.push(y1[1]);
  cmd.push(0);
  cmd.push(0);
  cmd.push(0);
  cmd.push(0);
  
  this.directWrite(callback, 1, cmd);
};

Device.prototype.readFileFromDisk = function (filename, callback) {
  var size;
  var buffer;
  var current;

  var self = this;


  function fileDataCallback (err, data) {
    console.log("fileDataCallback");
    for (var i = 0; i < data.length; i++) {
      buffer[current++] = data[i];
    }
    
    if (size === current) {
      callback(undefined, buffer.slice(0, buffer.length - 1));
    } else {
      console.log("acknowledging: " + size + ", " + current);
      self.directWrite(fileDataCallback, (size - current) > 10 ? 10 : (size - current), [ 0x06 ]);
    }
  }

  function fileSizeCallback (err, data) {
    size = (data[0] * (256 * 256 * 256)) + (data[1] * (256 * 256)) + (data[2] * 256) + data[3] + 1;
    
    if (size === 0) {
      callback('unknown file');
    } else {
      buffer = new Buffer(size);
      current = 0;
      console.log((size < 10) ? size + 1 : 10);
      self.directWrite(fileDataCallback, (size < 10) ? size : 10, [ 0x06 ]);
    }
    console.log("size = " + size);
  }
  
  var cmd = [ 0x40, 0x61, 0x0a ];
  for (var i = 0; i < filename.length; i++) {
    cmd.push(filename.charCodeAt(i));
  }
  cmd.push(0);
  
  this.directWrite(fileSizeCallback, 4, cmd);
};


exports.Device = Device;