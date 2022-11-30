const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

async function run() {
    try {
        const categoriesCollection = client
            .db("SecondSet")
            .collection("categories");

        // get all categories
        app.get("/categories", async (req, res) => {
            const cursor = categoriesCollection.find({});
            const categories = await cursor.toArray();
            res.send(categories);
        });
    } finally {
    }
}
run().catch(console.log);

app.get("/", async (req, res) => {
    res.send("SecondSet server is running");
});

app.listen(port, () => console.log(`SecondSet running on ${port}`));
