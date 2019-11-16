# os2l
NodeJS implementation of the Open Sound to Light protocol.

The standard is defined [here](http://os2l.org/). This package was only tested on Windows with VirtualDJ.

## Installation
```
npm install os2l
```

## Usage
### For servers 
Usually the DMX software: 
```javascript
const { OS2LServer}  = require("os2l");

// All options are optional
let server = new OS2LServer({
  port: 5000 // TCP Port to listen on
});

// Register events
server.on("error", err => {
  console.error(err);
});

server.on("btnOn", name => {
  if (name == "fog") {
    // ... code for starting a fog machine
    server.feedback("fog", "on");
  }
});

server.on("btnOff", name => {
  if (name == "fog") {
    // ... code for stopping a fog machine
    server.feedback("fog", "off");
  }
});

server.on("beat", data => {
  // Toggle light or something
});

// Start the server
server.start().then(() => {
  console.log("Server is now listening on port: ", server.port);
});
```

### For clients
Usually the audio software:
```javascript
const {OS2LClient} = require("os2l");

let client = new OS2LClient();
client.on("error", err => console.error(err));

client.on("feedback", data => {
  // Let a button light up or something
});

client.connect().then(() => {
  client.buttonOn("hi");
  client.beat(true, 1, 120);
});
```

## Hosting on Windows
To host on windows, "Bonjour Print Services" or the SDK needs to be installed on the host system: [https://support.apple.com/kb/DL999](https://support.apple.com/kb/DL999).

I don't like that we need to depend on an apple product for this to work. A DNS-SD service is already implemented in windows 10 but is not accessible to us. [This](https://docs.microsoft.com/en-us/uwp/api/windows.networking.servicediscovery.dnssd.dnssdserviceinstance) is a good starting point to dig deeper and maybe find a solution.

## Hosting on Linux
To work on Linux, "Avahi" is needed. (Not tested)

## Hosting  on MacOS
On MacOS it will work default. (Not tested)

## API
### OS2LServer
```javascript
let server = new OS2LServer({
  port: 1806, // Port for the server to listen on
  doPublish: true // (optional) Use DNS-DS?
});
```

#### `Event: error`
Emitted when an error occours. After this event was called the server will stop and needs to be opened manually via `server.start()`.

#### `Event: warning`
Emitted when something happens that should not happen but the server can stay open.

#### `Event: connection`
Emitted when a connection from a client was made.

#### `Event: closed`
Emitted after the server was closed. Is also called when the server stops because of an error.

#### `Event: btnOn`
Emitted when a button is pressed. First argument is the name of the button.

#### `Event: btnOff`
Emitted when a button is released. First argument is the name of the button.

#### `Event: cmd`
Emitted when a command was send by a client. First argument is the received object.

#### `Event: btn`
Emitted when a client changes the state of a button. First argument is the received object.

#### `Event: beat`
Emitted when a client sends a beat packet. First argument is the received object.

#### `Event: data`
Emitted when anything comes from the client. First argument is the received object. This event can be used to extend the protocol.

#### `server.start()`
Starts the server

#### `server.stop()`
Stops the server

#### `server.feedback(name, state, page)`
Sends feedback to all clients. The arguments are defined in the standard.

### OSL2Client
```javascript
let client = new OS2LClient({
  port: 1806, // (optional) The port to connect to
  host: "localhost", // (optional) Hostname of the server
  useDNS_SD: false, // (optional) Use DNS-SD? Is this is set to true, host and port are determined automatically.
  autoReconnect: true // (optional) Reconnect after connection lost?
});
```

#### `Event: error`
Emitted after an error occours.

#### `Event: connected`
Emitted after a connection was made.

#### `Event: closed`
Emitted after the connection ended.

#### `Event: feedback`
Emitted when the server sends feedback. The arguments are name, state and page. When no page was given this argument is undefined as this argument is optional to the standard.

#### `client.beat(change, pos, bpm)`
Sends a beat to the server. Arguments are defined in the standard.

#### `client.buttonOff(name)`
Sends a `btnOff` event to the server. First argument is the name of the button.

#### `client.buttonOn(name)`
Sends a `btnOn` event to the server. First argument is the name of the button.

#### `client.close()`
Closes the connection.

#### `client.command(id, param)`
Sends a command to the server. `id` (Integer) is the id of the command and `param` a number between 0 and 1.

#### `client.connect()`
Connects to the server. When no server data is given, this method searches for the server with DNS-SD.

#### `client.custom(object)`
Sends a custom object to the server. This method can be used to extend the protocol.

## License
[MIT](https://choosealicense.com/licenses/mit/)