var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.Promise = Promise;

var dbURL =
  "mongodb+srv://user:user@cluster0.utimb.mongodb.net/<dbname>?retryWrites=true&w=majority";

var messageModel = mongoose.model("message", { name: String, message: String });

app.get("/messages", (req, res) => {
  messageModel.find({}, (err, messages) => {
    res.send(messages);
  });
});

app.get("/messages/:user", (req, res) => {
  var user = req.params.user;
  messageModel.find({ name: user }, (err, messages) => {
    res.send(messages);
  });
});

app.post("/messages", async (req, res) => {
  try {
    var message = new messageModel(req.body);
    var savedMessage = await message.save();

    console.log("saved");
    var censored = await messageModel.findOne({ message: "bad" });
    if (censored) await messageModel.remove({ _id: censored.id });
    else io.emit("message", req.body);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
    console.error(err);
  } finally {
    console.log("message logged");
  }
});

io.on("connection", (socket) => {
  console.log("a user has connected");
});

mongoose.connect(
  dbURL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    console.log("mongo db connection", error);
  }
);

var server = http.listen(3000, () => {
  console.log("server is listening on port", server.address().port);
});
