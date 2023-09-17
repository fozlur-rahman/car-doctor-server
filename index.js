const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const req = require('express/lib/request');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middleware  
app.use(cors());
app.use(express.json());
// ============================================================

const uri = `mongodb+srv://${process.env.DOC_USER}:${process.env.DOC_PASS}@cluster0.hslh8b3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'un auth access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'un auth access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const carDocCollection = client.db('carDoctor').collection('services');
        const carBookCollection = client.db('carDoctor').collection('booking');
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // JWT 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            console.log({ token });
            res.send({ token });
        })

        // find multiple 
        app.get('/services', async (req, res) => {
            const cursor = carDocCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // find one 

        app.get('/services/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const selectedItem = await carDocCollection.findOne(query)

                if (!selectedItem) {
                    res.status(404).send('Service not found');
                } else {
                    res.send(selectedItem);
                }
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        //    find with condition 
        app.get('/booking', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: 'forbiden user' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
                const result = await carBookCollection.find(query).toArray();
                res.send(result);
            }
        })

        //    booking 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await carBookCollection.insertOne(booking);
            res.send(result);
        })
        // delete 
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await carBookCollection.deleteOne(query);
            res.send(result);
        })

        // update one 
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                }
            }
            const result = await carBookCollection.updateOne(query, updateDoc);
            res.send(result);
        })



    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);











// =========================================================
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})