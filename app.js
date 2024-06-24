const express = require('express');
const mongoose = require('mongoose');
const fetchAndSeedData = require('./utils/fetchData');
const cors = require ('cors')
const apiRoutes = require('./routes/api')

const app = express();
const PORT = 5000;

mongoose.connect('mongodb://localhost:27017/transaction').then(()=>{
    console.log('MongoDB connected');
    fetchAndSeedData();
}).catch(err =>{
    console.error(err.message);
})

app.use(express.json());
app.use(cors());

app.use('/api',apiRoutes);

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})


