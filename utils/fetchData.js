const axios = require('axios')
const Transaction = require ('../models/Transaction');

const fetchAndSeedData = async ()=>{
    try{
        const {data} = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json')

        await Transaction.deleteMany({})
        await Transaction.insertMany(data);

        console.log('Database seeded successfully');
    }catch (error){
        console.error('Error seeding database', error.message);
    }
}
module.exports = fetchAndSeedData;