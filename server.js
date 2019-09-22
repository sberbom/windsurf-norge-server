const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const env = require('./const');

const CONNECTION_URL = `mongodb+srv://${env.user}:${env.password}@sberbom-hh3y2.azure.mongodb.net/test?retryWrites=true&w=majority`;
const DATABASE_NAME = "windsurfnorge01";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());

var database;

app.listen(3300, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, {useUnifiedTopology: true}, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        spotsdb = database.collection("spots");
        userdb = database.collection("users");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/spots", (request, response) => {
    spotsdb.find().toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.post('/add_spot', (req, res) => {
    const {name, description, approach, latlng} = req.body;
    spot = {
        name: name, 
        description: description,
        picture: "",
        latlng: latlng,
        approach: approach
    };
    spotsdb.insertOne(spot);
    res.send(spot);
});

app.post("/spot/:spotName", (request, response) => {
    spotsdb.findOne({ "_spotName": new ObjectId(request.params.id) }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.post("/login", (request, response) => {
    userdb.findOne({"username": request.body.username}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if(result){
            bcrypt.compare(request.body.password, result.password, function(err, res) {
                if(res){
                    response.send(result);
                }
                else{
                    response.status(400).json('Feil brukernavn eller passord');
                }
            });
        }
        else {
            response.status(400).json('Feil brukernavn');
        }
    })
})

app.post("/register", (req, res) => {
    const {username, password, email} = req.body;
    userdb.findOne({"username": username}, (err, result) => {
        if(result){
            res.status(400).json('Brukernavnet er i bruk')
            return;
        }
        else{
            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(password, salt, function(err, hash) {
                    user = {
                        username: username,
                        email: email,
                        password: hash
                    }
                    userdb.insertOne(user);
                    res.send(user);
                });
            });
        }
    })
})