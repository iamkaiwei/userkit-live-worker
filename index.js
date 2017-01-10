require('dotenv').config();

const per_second = parseInt(process.env.PER_SECOND);
const project_id = process.env.PROJECT_ID;
const Redis = require('ioredis');
const redis_client = new Redis(process.env.REDIS);
const pub_client = new Redis(process.env.REDIS);

const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error.');
  process.exit(1);
});

const LiveEvent = require('./models/LiveEvent');

setInterval(() => {
  let stream = redis_client.scanStream({ match: `${project_id}:*` });
  let pipeline = redis_client.pipeline();
  let keys = [];

  stream.on('data', (result) => {
    result.forEach(k => {
      keys.push(k.split(':')[1]);
      pipeline.scard(k);
    })
  });

  stream.on('end', () => {
    if (keys.length == 0) return;

    pipeline.exec()
    .then(result => {
      let current_date = new Date();
      let date_str = current_date.toISOString().substring(0, 10);
      let hour = current_date.getHours();
      let min = `data.${current_date.getMinutes()}`;
      let sec = current_date.getSeconds();

      keys.forEach((k, idx) => {
        if (result[idx][0]) return;

        let count = result[idx][1];
        pub_client.publish(`${project_id}:${k}`, `${sec}-${count}`);

        LiveEvent.findOneAndUpdate(
          { project_id: mongoose.Types.ObjectId(project_id), name: k, date: date_str, hour: hour },
          { $push: { [min]: count } },
          { upsert: true }
        ).then(doc => doc)
        .catch(err => console.log(err))
      })
    })
  });
}, per_second);
