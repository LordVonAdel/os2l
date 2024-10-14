const { EventEmitter } = require("events");
const bonjour = require('bonjour')();
const net = require("net");

/**
 * Provides a TCP client that is able to talk in OS2L language
 */
class OS2LClient extends EventEmitter {

  /**
   * Creates an OS2LClient instance
   * @param {Object} [options] Options object
   * @param {Number} [options.port] Port to connect to
   * @param {String} [options.host] Host to connect to
   * @param {Boolean} [options.useDNS_SD] Use DNS-SD to detect port and host automatically
   * @param {Boolean} [options.autoReconnect] Do reconnect automatically after connection lost?
   * @param {Boolean} [options.autoReconnectInterval] Interval to try reconnects in milliseconds
   */
  constructor(options = {}) {
    super();

    this.port = 1504;
    this.host = "local";
    this.useDNS_SD = true;
    this.autoReconnect = true;
    this.autoReconnectInterval = 1000;

    if (typeof options != "object") throw new Error("Expected an object for options!");

    if ("port" in options) {
      this.port = Number(options.port);
    }

    if ("host" in options) {
      this.host = String(options.host);
    }

    if ("useDNS_SD" in options) {
      this.useDNS_SD = Boolean(options.useDNS_SD);
    }

    if ("autoReconnect" in options) {
      this.autoReconnect = Boolean(options.autoReconnect);
    }

    if ("autoReconnectInterval" in options) {
      this.autoReconnectInterval = Number(options.autoReconnectInterval);
    }

    // The TCP client
    this.client = null;

    if (this.autoReconnect) {
      this.on("closed", async () => {
        this.emit("warning", "OS2L Client had error. Trying to reconnect...");
        await new Promise(resolve => setTimeout(resolve, this.autoReconnectInterval))
        this.connect();
      });
    }
  }

  /**
   * Connects the client
   * @param {Function} callback Is called when a connection was made
   * @return {Promise<void>}
   */
  connect(callback) {
    return new Promise(async (resolve, reject) => {
      const cb = () => {
        if (callback) callback();
        this.emit("connected");
        resolve();
      };
  
      if (this.client) {
        this.emit("warning", new Error("OS2L Client is already connected!"));
        return;
      }
  
      this.client = new net.Socket();

      this.client.on("error", async err => { 
        this.close();
        if (!this.autoReconnect) {
          this.emit("error", err);
          reject()
        }
      });

      let buffer = "";
      
      this.client.on('data', data => {
        buffer += data.toString('utf8');

        let endIndex;
        while ((endIndex = buffer.indexOf('}')) !== -1) {
          let jsonString = buffer.slice(0, endIndex + 1); // Extract the substring up to and including the closing brace
          buffer = buffer.slice(endIndex + 1); // Remove the parsed JSON from the buffer

          try {
            let parsed = JSON.parse(jsonString);
            if (parsed.evt == "feedback") {
              this.emit("feedback", parsed.name || "", parsed.state || "off", parsed.page);
            }
          } catch (e) {
            console.error(e);
            // Handle JSON parse error
            this.emit("warning", new Error("Bad OS2L package received!"));
            // Optionally log or handle the error further
          }
        }
      });

      this.client.on("close", () => {
        if (this.client) {
          this.close();
        }
      });
  
      if (this.useDNS_SD) {
        this._dnsSdFind((host, port) => {
          this.client.connect(port, host, cb);
        });
      } else {
        this.client.connect(this.port, this.host, cb);
      }
    });
  }

  _dnsSdFind(cb) {
    bonjour.findOne({type: "os2l"}, function (service) {
      cb(service.host, service.port);
    });
  }

  _sendObject(object) {
    if (!this.client) return;
    let json;
    if (typeof object == "string") {
      json = object;
    } else {
      json = JSON.stringify(object);
    }
    this.client.write(json);
  }

  /**
   * Closes the connection
   */
  close() {
    if (!this.client) {
      this.emit("error", new Error("Can't close OS2LClient because it is not open!"));
      return;
    }
    this.client.destroy();
    this.client.unref();
    this.client = null;

    this.emit("closed");
  }

  /**
   * Sends a "btn" even with state "on"
   * @param {String} name Name of the button
   */
  buttonOn(name) {
    if (!this.client) this.emit("warning", new Error("OS2L Client not connected"));
    this._sendObject({
      evt: "btn",
      name: name,
      state: "on"
    });
  }

  /**
   * Sends a "btn" event with status "off"
   * @param {} name Name of the button
   */
  buttonOff(name) {
    if (!this.client) this.emit("warning", new Error("OS2L Client not connected"));
    this._sendObject({
      evt: "btn",
      name: name,
      state: "off"
    });
  }

  /**
   * Sends a "cmd" event
   * @param {Number} id Id of the event
   * @param {Number} param Parameter between 0 and 1
   */
  command(id, param) {
    if (!this.client) this.emit("warning", new Error("OS2L Client not connected"));
    this._sendObject({
      evt: "cmd",
      id: id,
      param: param
    });
  }

  /**
   * Sends a "beat" event
   * @param {Boolean} change
   * @param {Number} pos Position of the beat
   * @param {Number} bpm Beats per minute
   */
  beat(change, pos, bpm) {
    if (!this.client) this.emit("warning", new Error("OS2L Client not connected"));
    this._sendObject({
      evt: "beat",
      change: change,
      pos: pos,
      bpm: bpm
    });
  }

  /**
   * Sends a custom object
   * @param {Object} object Object to be stringified to json
   */
  custom(object) {
    if (!this.client) this.emit("warning", new Error("OS2L Client not connected"));
    this._sendObject(object);
  }

  /**
   * Is true when the client is currently connected to a server
   */
  get isConnected() {
    return (this.client != null);
  }

}

module.exports = OS2LClient;

/**
 * @typedef {["error" | "connected" | "closed" | "feedback"]} OS2LClientEvents
 */
