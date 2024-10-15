const { EventEmitter } = require("events");
const bonjour = require("bonjour")();
const net = require("net");

/**
 * The OS2LServer handles incoming commands. Usally this is part of a DMX Software.
 */
class OS2LServer extends EventEmitter {

  /**
   * Creates an instance of an OS2LServer
   * @param {Object} options Options object
   * @param {Number} options.port Port to listen on
   * @param {Boolean} [options.doPublish] Should the server publish itself to DNS-SD
   */
  constructor(options = {port: 1503}) {
    super();

    // Option parameters
    this.port = 1503;
    this.doPublish = true;

    if (typeof options != "object") throw new Error("Expected an object for options!");

    if ("port" in options) {
      this.port = Number(options.port);
    }

    if ("doPublish" in options) {
      this.doPublish = Boolean(options.doPublish);
    }

    // Other attributes
    this.net = null;
    this.clients = [];

    // Publish
    if (this.doPublish) {
      this.service = bonjour.publish({
        name: "os2l",
        type: "os2l",
        port: this.port
      });
    }

    this.on("error", () => {
      this.stop();
    });
  }

  /**
   * Starts listening
   * @param {Function} [callback] Is called when the server started listening.
   */
  start(callback = null) {
    return new Promise((resolve, reject) => {
      if (this.net) {
        let err = new Error("OS2LServer is already running!");
        this.emit("warning", err);
        reject(err);
        return;
      }

      this.net = net.createServer((client) => {
        this.clients.push(client);

        this.emit("connection");

        client.on("error", err => {
          client.destroy();
          let index = this.clients.indexOf(client);
          if (index >= 0) {
            this.clients.splice(index, 1);
          }
          this.emit("closed");
        });

        client.on("data", data => {
          let parsed = null;
          try {
            let str = data.toString('utf8');
            parsed = JSON.parse(str);
          } catch(e) {
            this.emit("warning", new Error("Bad OS2L package received!"));
          }

          if (parsed) {
            this.emit("data", parsed);
            this.emit(parsed.evt, parsed);
            if (parsed.evt == "btn") {
              if (parsed.state == "on") {
                this.emit("btnOn", parsed.name);
              } else {
                this.emit("btnOff", parsed.name);
              }
            }
          }
        });

        client.on("end", () => {
          let index = this.clients.indexOf(client);
          if (index >= 0) {
            this.clients.splice(index, 1);
          }
          this.emit("closed");
        });
      
      });

      this.net.on("error", err => { 
        this.emit("error", err);
        reject();
      });

      this.net.listen(this.port, () => {
        if (callback) {
          callback();
        }
        resolve();
      });
    });
  }

  /**
   * Stops the server
   */
  stop() {
    if (!this.net) {
      this.emit("warning", new Error("OS2LSever can't close because it is not running."));
      return;
    }
    this.net.close();
    this.net.unref();
    this.net = null;

    for (const client of this.clients){
      client.destroy()
    }

    if (this.service) {
      this.service.stop();
      this.service = null;
    }

    this.emit("closed");
  }

  /**
   * Adds an event listener
   * @param {OS2LServerEvents} args Type of the event
   */
  addListener(...args) {
    super.addListener(...args);
  }

  /**
   * Adds an event listener
   * @param {OS2LServerEvents} args Type of the event
   */
  on(...args) {
    super.on(...args);
  }

/**
 * Sends feedback to all clients
 * @param {String} name Name of the button
 * @param {Boolean} state State of the button
 * @param {String} [page] Name of the page
 */
  feedback(name, state, page = undefined) {
    let json = JSON.stringify({
      evt: "feedback",
      name, state, page
    });
    for (let client of this.clients) {
      client.write(json);
    }
  }

}

module.exports = OS2LServer;

/**
 * @typedef {["error" | "warning" | "data" | "btn" | "cmd" | "btnOn" | "btnOf" | "beat" | "connection" | "closed"]} OS2LServerEvents
 */
