var OK    = new Buffer([ 0x06 ]),
    ERROR = new Buffer([ 0x15 ]);

var LANDSCAPE = 1,
    PORTRAIT  = 2;

function Mock4DDisplay (serial) {
  var self = this;
  
  // default settings of device
  self.orientation = PORTRAIT;
  self.bgcolor = 0;

  self.sp = serial;

  self.sp.on('data', function (data) {
    self.parse(data);
  });

  self.parse = function (data) {
    // autobaud
    if (data[0] === 0x55) {
      self.sp.write(OK);
    }
    
    // version
    else if (data[0] === 0x56) {
      if (self.orientation === PORTRAIT) {
        self.sp.write(new Buffer([ 1, 23, 69, 0x24, 0x32 ]));
      } else {
        self.sp.write(new Buffer([ 1, 23, 69, 0x32, 0x24 ]));
      }
    }
    
    // replace background colour
    else if (data[0] === 0x42) {
      var l = data[1], r = data[2];
      
      self.bgcolor = (l * 256) + r;
      
      self.sp.write(OK);
    }
    
    // set background colour
    else if (data[0] === 0x4b) {
      var l = data[1], r = data[2];
      
      self.bgcolor = (l * 256) + r;
      
      self.sp.write(OK);
    }
    
    // clear screen
    else if (data[0] === 0x45) {
      self.sp.write(OK);
    }
    
    // draw image 65k
    else if (data[0] === 0x49) {
      var x = (data[1] * 256) + data[2];
      var y = (data[3] * 256) + data[4];
      var w = (data[5] * 256) + data[6];
      var h = (data[7] * 256) + data[8];

      if ((data.length - 10) === w * h * 2) {
        self.sp.write(OK);
      } else {
        self.sp.write(ERROR);
      }
    }

    // draw circle
    else if (data[0] === 0x43) {
      self.sp.write(OK);
    }

    // draw rectangle
    else if (data[0] === 0x72) {
      self.sp.write(OK);
    }

    // set pen size
    else if (data[0] === 0x70) {
      self.sp.write(OK);
    }

    else {
      console.log("unknown command");
      console.dir(data);
    }
  };
}

exports = module.exports = Mock4DDisplay;