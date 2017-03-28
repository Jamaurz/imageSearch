var express = require('express')
var bodyparser = require('body-parser')
var cors = require('cors')
var path = require('path')

/* serch image google*/
var keyAPI = process.env.keyAPI;
var keyCSE = process.env.keyCSE;
var GoogleImages = require('google-images');
var client = new GoogleImages(keyCSE, keyAPI);
/** mongoose */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var historySchema = new Schema({
  term: String,
  when: String
});

var History = mongoose.model('History', historySchema);

var url = process.env.MONGOLAB_URI;
mongoose.connect(url)

/** settings */
var app = express()

app.use(cors())
app.use(bodyparser.json())
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade')

/** index */
app.get('/', function(req, res) {
    res.render('index');   
});
    
/** insert and display new query(link) */
app.get('/api/imagesearch/:link(*)', function(req, res) {
    var link = req.params.link;
    var offset = req.query.offset || 1;
    console.log('link', link, 'offset', offset);
    client.search(link, {page: offset})
        .then(function(img) {
            res.send(img.map(newObj));
        });
        
    var historyObj = {
      "term": link,
      "when": new Date().toLocaleString()
    };
    
    var history = new History(historyObj);
    history.save(function(err, history) {
      if (err) throw err;
      console.log('save ', historyObj);
    });
});
    
/** find lastest image query */
app.get('/api/latest/imagesearch', function(req, res) {
    History.find({}, null, {
      "limit": 10,
      "sort": {
        "when": -1
      }
    }, function(err, history) {
      if (err) return console.error(err);
      res.send(history.map(formatFind));
    });
});

function newObj(img) {
    return {
        "url": img.url,
        "snippet": img.description,
        "thumbnail": img.thumbnail.url,
        "context": img.parentPage
    }
} 
function formatFind(doc) {
    return {
        term: doc.term,
        when: doc.when
    };
}

var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('Example app listening on port ' + port)
})