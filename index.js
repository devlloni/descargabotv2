const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const twitter = require('twit');
const redis = require('redis');
const mongoose = require('mongoose');
const https = require('https');
const indexRouter = require('./router/index');
const helper = require('./helper/index');
const cronJob = require('cron').CronJob;
require('dotenv').config();
const app = express();
const data = require('./model/data');

mongoose.connect('mongodb+srv://dbAdmin:adlasta83110@cluster0.rfm5c.mongodb.net/descargabot', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

const conectarDb = async () => {
try {
  await mongoose.connect('mongodb+srv://dbAdmin:adlasta83110@cluster0.rfm5c.mongodb.net/descargabot', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  console.log('[ + ] ¡Database connected!');
} catch (error) {
console.log('ERROR DB:', error); 
}
}
conectarDb();

const twitterClient = new twitter({
  consumer_key: 'GFH7dR1drwVETJyTYPtnjQoh6',
  consumer_secret: 'M7Z8evCjAe1wThLXZpMlXutsWp4rDYy26HFw88TV54DQK1oYxk',
  access_token: '1236724403792199681-M50lFgAMSSIiTneD4T82sThIYCqpEz',
  access_token_secret: 'f1WCjMM4XpEhhfzZTnkGdg2784sUf7ZyKJvIpOLhkyltZ',
});

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(path.resolve(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', indexRouter);

function handleStream(event) {
  //only return value for replies to tweet where original tweet isnt bot that includes save as tweet
  let tweet = event.text;
  let tweetID = event.id_str;
  let tweetOwner = event.user.screen_name;
  let parentTweet = event.in_reply_to_status_id_str;
  let parentTweetOwner = event.in_reply_to_screen_name;

  if (parentTweet && parentTweetOwner !== 'save_video') {
    //retrieve tweet id && return tweet parent
    twitterClient.get(
      'statuses/show',
      { id: parentTweet, include_entities: true, tweet_mode: 'extended' },
      function (err, tweet) {
        if (err) console.log('stateus/show error', err);
        let { full_text, extended_entities } = tweet;
       
        if (extended_entities) {
          // if tweet contains media
          const media = extended_entities.media
            .filter((media) => media.type == 'video' || media.type == 'animated_gif')
            .map((media) => media.video_info.variants)
            .reduce((accum, current) => accum.concat(current), [])
            .filter((media) => media.content_type == 'video/mp4');
            
          if (media && media.length) {
            console.log('media',  media);
            helper.createUserIfNotExist(tweetOwner).then(function (user) {
              /* create user and save record, if successful reply user*/
              data.create(
                {
                  media,
                  text: full_text,
                  original_tweetUrl: '',
                  original_tweetID: tweet.id_str,
                  generated_date: new Date(),
                  user_id: user._id,
                },
                function (err) {
                  replyTweet(tweetOwner, tweetID);
                }
              );
            });
          }
        } //console.log('doesnt contain a video');
      }
    );
  }
}

function replyTweet(screen_name, tweetID, callback) {
  let status = helper.messageTemplate(screen_name);
  twitterClient.post(
    'statuses/update',
    { status: status, in_reply_to_status_id: tweetID },
    function (err, tweet) {
      if (err) console.log(err);
    }
  );
}

var stream = twitterClient.stream('statuses/filter', { track: '@DescargaBot' });

stream.on('tweet', function (event) {
  // console.log('new tweet!:', event);
  handleStream(event);
});

stream.on('error', function (error) {
  console.log(error);
});

//start cronJob to reset counter value every 15Minutes
new cronJob(
  '0 0 * * *',
  function () {
    console.log('******* cron job *******')
    let now = new Date();
    now.setHours(now.getHours() - 48);
    data.deleteMany({ generated_date: { $lt: now } }, (err, res) => {
      if (err) {
        console.log('an error occured');
      } else {
        console.log(res.deletedCount, ' items deleted');
      }
    });
  },
  null,
  true,
  'America/Los_Angeles'
);

app.use(function (err, req, res, next) {
  res.render('error', { message: err.message });
});

app.listen(80);
