const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@jscluster.n9s8s9n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "invalid token" });
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {
        const categoriesCollection = client
            .db("SecondSet")
            .collection("categories");
        const usersCollection = client.db("SecondSet").collection("users");
        const productsCollection = client
            .db("SecondSet")
            .collection("products");
        const bookingsCollection = client
            .db("SecondSet")
            .collection("bookings");

        // get all categories
        app.get("/categories", async (req, res) => {
            const cursor = categoriesCollection.find({});
            const categories = await cursor.toArray();
            res.send(categories);
        });

        // get a single category
        app.get("/category/:category", async (req, res) => {
            const category = req.params.category;
            const query = { category };
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        //get all products
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        //get specific seller products
        app.get("/products/:email", async (req, res) => {
            const email = req.params.email;
            const query = { seller_email: email };
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        //get advertised products
        app.get("/advertised", async (req, res) => {
            const query = { isAdvertised: true, isBooked: false };
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        //delete specific seller product
        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });

        // patch a product
        app.patch("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const update = {
                $set: {
                    isBooked: req.body.isBooked,
                },
            };
            const result = await productsCollection.updateOne(query, update);
            res.send(result);
        });

        app.patch("/advertisement/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const update = {
                $set: {
                    isAdvertised: req.body.isAdvertised,
                },
            };
            const result = await productsCollection.updateOne(
                query,
                update,
                options
            );
            res.send(result);
        });

        // get access token
        app.get("/jwt", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign(
                    { email: email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );
                return res.send({ token: token });
            }
            res.status(401).send({ message: "Invalid email" });
        });

        // get a admin
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        });

        // get a buyer
        app.get("/users/buyers/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === "buyer" });
        });

        // get a seller
        app.get("/users/sellers/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === "seller" });
        });

        // all user
        app.get("/users", async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });

        //delete a user
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        // check user role
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ role: user?.role });
        });

        // get all bookings
        app.get("/bookings", async (req, res) => {
            const cursor = bookingsCollection.find({});
            const bookings = await cursor.toArray();
            res.send(bookings);
        });

        // get specific buyer booking
        app.get("/bookings/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const cursor = bookingsCollection.find(query);
            const bookings = await cursor.toArray();
            res.send(bookings);
        });

        // create a user
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //patch social media login user (will not creating user in every social media login)
        app.patch("/users/:email", async (req, res) => {
            const email = req.body.email;
            const query = { email };
            const options = { upsert: true };
            const update = {
                $set: {
                    name: req.body.name,
                    email: req.body.email,
                    role: req.body.role,
                },
            };
            const result = await usersCollection.updateOne(
                query,
                update,
                options
            );
            res.send(result);
        });

        //create bookings
        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // create a product
        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });
    } finally {
    }
}
run().catch(console.log);

app.get("/", (req, res) => {
    res.send("SecondSet server is running");
});

app.listen(port, () => console.log(`SecondSet running on ${port}`));
