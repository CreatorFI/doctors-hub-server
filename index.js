const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const fs = require("fs");
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use(express.static("doctors"));
app.use(fileUpload());
const port = 5000;

const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j1wjl.mongodb.net/doctors-hub?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const appointmentsCollection = client
    .db("doctors-hub")
    .collection("appointments");
    const doctorCollection = client.db("doctors-hub").collection("doctors");
  // perform actions on the collection object
  //   client.close();

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/appointments", (req, res) => {
    appointmentsCollection.find().toArray((err, items) => {
      console.log("from database ", items);
      res.send(items);
    });
  });
  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email; 
    const newDate = new Date(date.date);
  
    const convertedDate = newDate.toDateString();
    const filter = {convertedDate};
    console.log(convertedDate);
 
      doctorCollection.find({email:email}).toArray((err,doctors)=>{
       if(doctors.length ===0){
         filter.email = email;
       }
       appointmentsCollection
       .find(filter)
       .toArray((err, documents) => {
         console.log(documents);
         res.send(documents);
       });
      })
  });




  app.post("/addDoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    console.log(file, name, email);
    const  image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
  };
  doctorCollection.insertOne({ name, email, image })
  .then(result => {
      res.send(result.insertedCount > 0);
  })
  
    
  });
  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email; 
      doctorCollection.find({email:email}).toArray((err,doctors)=>{
       res.send(doctors.length>0);
      })
  });



  console.log("Database Connected");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || port, () => {
  console.log(`listening at http://localhost:${port}`);
});
