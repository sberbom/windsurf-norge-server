const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const env = require('./const');
const {OAuth2Client} = require('google-auth-library');


const CONNECTION_URL = `mongodb+srv://${env.user}:${env.password}@sberbom-hh3y2.azure.mongodb.net/test?retryWrites=true&w=majority`;
const DATABASE_NAME = "windsurfnorge01";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());

const profile = require( './profile' );
app.use( '/profile', profile );

var database;

const client = new OAuth2Client(env.clientID);

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: env.clientID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
}


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

/**Get all spots */
app.get("/spots", (request, response) => {
    spotsdb.find().toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

/**Add spot */

app.post('/add_spot', async (req, res) => {
    const {name, description, approach, latlng, token} = req.body;
    try {
        await verify(token);
    }
    catch(error) {
        console.error(error);
        return;
    }    
    spot = {
        name: name, 
        description: description,
        picture: "",
        latlng: latlng,
        approach: approach,
    };
    spotsdb.insertOne(spot);
    res.send(spot);
});

/**udate spot */
app.post("/spot/update", async (req, res) => {
    const {query, update, options, token} = req.body;
    try {
        await verify(token);
    }
    catch(error) {
        console.error(error);
        return;
    }
    spotsdb.updateOne(query, update, options)
        .then(result => {
            const { matchedCount, modifiedCount } = result;
            if (matchedCount && modifiedCount) {
                console.log(`Successfully updated the item.`)
                res.send(result)
            }
        })
        .catch(err => console.error(`Failed to update the item: ${err}`))
});

/**Increment views */
app.post("/spot/addView", async (req, res) => {
    const {query, update, options, token} = req.body;
    spotsdb.updateOne(query, update, options)
        .then(result => {
            const { matchedCount, modifiedCount } = result;
            if (matchedCount && modifiedCount) {
                console.log(`Successfully updated the item.`)
                res.send(result)
            }
        })
        .catch(err => console.error(`Failed to update the item: ${err}`))
});

app.post("/oneSpot", (request, response) => {
    spotsdb.findOne({ name: request.body.name }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

/** log inn */
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

/** Registrer */
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