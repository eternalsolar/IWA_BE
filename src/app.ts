import express from 'express';
import { Article } from './entity/models/article'
const app = express();
const port = 3000;
let a: Article[] = [];
app.get('/', (req, res) => {
    let response = res;
    var Crawler = require('crawler');
    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            } else{
                var $ = res.$;
                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
                a = $('.storylink').toArray().map((b: any) => {

                    return new Article($(b).html(), $(b).attr('href'))
                });
                response.send(a[0].link);
            }
            
            done();
        }
    });
    
    // Queue just one URL, with default callback
    c.queue('https://news.ycombinator.com/best')   
    
    

});
app.listen(process.env.PORT || 3000, () => {
  
  return console.log(`server is listening on ${port}`);
}).on('error', function (err) {
        console.log(err);
});

