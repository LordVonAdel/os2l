const { EventEmitter } = require("events");

module.exports = class DataHandler extends EventEmitter {

    constructor() {
        super();
        this.streamContent = "";
    }

    handle(data) {
        this.streamContent += data;

        if (this.streamContent.charAt(0) != "{") {
            this.emit("error", new Error(`Bad Data: "${this.streamContent}"`));
            this.streamContent = "";
        }

        let counter = 0;
        // This breaks when "{" or "}" is part of a string inside the json string
        for (let i = 0; i < this.streamContent.length; i++) {
            const char = this.streamContent[i];
            if (char == "{") counter++;
            if (char == "}") {
                counter--;
                if (counter == 0) {
                    const jsonContent = this.streamContent.substring(0, i + 1);
                    try {
                        const parsed = JSON.parse(jsonContent);
                        this.emit("data", parsed);
                        this.streamContent = this.streamContent.substring(i + 1);
                        // Restart for next potential object in string
                        counter = 0;
                        i = -1;
                    } catch(err) { // JSON corrupted
                        this.streamContent = "";
                        this.emit("error", err);
                        break;
                    }
                }
            }
        }
    }

}