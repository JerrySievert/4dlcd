var vows = require('vows');

var assert = require('assert');

var device = require('../device'),
    mock4d = require('./mock/4dlcd'),
    serial = require('./mock/serial');



vows.describe('Device').addBatch({
  'When executing autobaud': {
    topic: function () {
      var mockserial = new serial();
      var lcd = new device.Device(mockserial.left);
      var mock = new mock4d(mockserial.right);
      
      lcd.autobaud(this.callback);
    },
    'the result is 0x06': function (err, data) {
      assert.equal(data[0], 0x06);
    }
  },
  'When executing version request': {
    topic: function () {
      var mockserial = new serial();
      var lcd = new device.Device(mockserial.left);
      var mock = new mock4d(mockserial.right);
      
      lcd.version(this.callback);
    },
    'the default result is [ 1, 23, 69, 0x24, 0x32 ] (portrait)': function (err, data) {
      assert.equal(data[0], 1);
      assert.equal(data[1], 23);
      assert.equal(data[2], 69);
      assert.equal(data[3], 0x24);
      assert.equal(data[4], 0x32);
    }
  },
  'When replacing the background colour': {
    topic: function () {
      var mockserial = new serial();
      var lcd = new device.Device(mockserial.left);
      var mock = new mock4d(mockserial.right);
      var self = this;

      lcd.replaceBackgroundColour(255, 127, 0, function (err, data) { self.callback(err, data, mock); });
    },
    'the result is ok and the background colour set': function (err, data, mock) {
      assert.equal(data[0], 0x06);
      assert.equal(mock.bgcolor, 64480);
    },
    'When setting the background colour': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.setBackgroundColour(255, 127, 0, function (err, data) { self.callback(err, data, mock); });
      },
      'the result is ok and the background colour set': function (err, data, mock) {
        assert.equal(data[0], 0x06);
        assert.equal(mock.bgcolor, 64480);
      }
    },
    'When clearing the screen': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.clearScreen(this.callback);
      },
      'the result is ok': function (err, data) {
        assert.equal(data[0], 0x06);
      }
    },
    'When drawing an image': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.drawImage65k(0, 0, 1, 1, [ 1, 1 ], this.callback);
      },
      'the result is ok': function (err, data) {
        assert.equal(data[0], 0x06);
      }
    },
    'When drawing a circle': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.drawCircle(0, 0, 23, 0, 0, 0, this.callback);
      },
      'the result is ok': function (err, data) {
        assert.equal(data[0], 0x06);
      }
    },
    'When drawing a rectangle': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.drawRectangle(0, 0, 10, 10, 0, 0, 0, this.callback);
      },
      'the result is ok': function (err, data) {
        assert.equal(data[0], 0x06);
      }
    },
    'When setting pen size': {
      topic: function () {
        var mockserial = new serial();
        var lcd = new device.Device(mockserial.left);
        var mock = new mock4d(mockserial.right);
        var self = this;

        lcd.setPenSize(device.PEN_SOLID, this.callback);
      },
      'the result is ok': function (err, data) {
        assert.equal(data[0], 0x06);
      }
    }
  }
  
}).export(module);