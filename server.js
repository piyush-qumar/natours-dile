const mongoose=require('mongoose');

const dotenv=require('dotenv');
dotenv.config({path:'./config.env'});
const app=require('./app');


const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.Database_PASSWORD);

mongoose.connect(process.env.DATABASE_LOCAL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(()=>
    console.log('DB connection was successful'));
   

const port=process.env.PORT||4000;

const PORT = 4000;
app.listen(port, () => {
    console.log(`app running on port ${port}..`);
});