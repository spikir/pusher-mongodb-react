const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const api = require('./routes/api');
const Pusher = require('pusher');

const pusher = new Pusher({
    appId: '558308',
  key: '5495c71d5f7c19283597',
  secret: '57e2794278fd073e3492',
  cluster: 'eu',
  encrypted: true,
});
const channel = 'tasks';

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use('/', express.static(__dirname + '/app/public'));
app.use('/src', express.static(__dirname + '/app/src'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', api);


mongoose.connect('mongodb://localhost/tasksDb?replicaSet=rs');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection Error:'));

db.once('open', () => {
  app.listen(9000, () => {
    console.log('Node server running on port 9000');
  });

  const taskCollection = db.collection('tasks');
  const changeStream = taskCollection.watch();
    
  changeStream.on('change', (change) => {
    console.log(change);
      
    if(change.operationType === 'insert') {
      const task = change.fullDocument;
      pusher.trigger(
        channel,
        'inserted', 
        {
          id: task._id,
          task: task.task,
        }
      ); 
    } else if(change.operationType === 'delete') {
      pusher.trigger(
        channel,
        'deleted', 
        change.documentKey._id
      );
    }
  });
});
