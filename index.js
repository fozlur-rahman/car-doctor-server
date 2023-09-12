const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const req = require('express/lib/request');
const port = process.env.PORT || 5000;
require('dotenv').config();

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

async function run() {
    try {
        await client.connect();
        const carDocCollection = client.db('carDoctor').collection('services');
        const carBookCollection = client.db('carDoctor').collection('booking');
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


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
        app.get('/booking', async (req, res) => {
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