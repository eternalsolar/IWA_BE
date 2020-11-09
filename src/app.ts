import express from 'express';
import { Article } from './entity/models/article';
import { ASSETS, HOSTNAME } from './utility/constants';
const app = express();
require('events').EventEmitter.defaultMaxListeners = 15;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const port = 3000;
const redis = require('redis');
const psl = require('psl');
const client = redis.createClient({
    port: 17979,
    host: 'redis-17979.c1.ap-southeast-1-1.ec2.cloud.redislabs.com',
    password: '1234@Qwe',
})
let a: Article[] = [];
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});
app.get('/article/:link', (req, res) => {
    let Crawler = require('crawler');
    let extractor = require('unfluff');
    let link = req.params['link'];
    client.get(req.params['link'], (err, value) => {
        if (value == null) {
            let c = new Crawler();
            c.queue([{
                jar: true,
                uri: link,
                callback: function (error, res, done) {
                    if (error) {
                        console.log(error);
                    } else {
                        let $
                        if($){
                        let data = extractor.lazy($.html());
                        let ar = new Article($.title(), 0, data.image(), '', '', data.text());
                        res.send(ar);
                        }
                    }
                    done();
                }
            }]);
        }
        else {
            let ar = JSON.parse(value);
            res.send(ar);
        }

    });
})
app.get('/:page', (req, res) => {
    let response = res;
    let result = [];
    let Crawler = require('crawler');
    let extractor = require('unfluff');
    let c = new Crawler({
        maxConnections: 30,
        // This will be called for each crawled page
        callback: function (error, res, done) {
            if (error) {
                console.log(error);
            } else {
                let $ = res.$;

                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
                let promise = new Promise((resolve, reject) => {
                    a = $('.athing').toArray().map((b: any) => {
                        return new Promise((resolve, reject) => {
                            let aTag = $(b).find('.storylink');
                            let link = new RegExp(/^item\?id=[\d]*/g).test(aTag.attr('href')) == true ? `https://news.ycombinator.com/${aTag.attr('href')}` : aTag.attr('href')
                            let order = $(b).find('.rank').text().replace('.', '');
                            client.get(link, (err, value) => {
                                if (value == null) {
                                    c.queue([{
                                        jar: true,
                                        uri: link,
                                        callback: function (error, res, done) {
                                            if (error) {
                                                reject(error);
                                            } else {
                                                let $$ = res.$;
                                                // let mainPost = handleMainPost($$);
                                                if($$){
                                                let data = extractor.lazy($$.html());
                                                // let thumbnail = handleThumbnail($$, mainPost);
                                                let ar = new Article(aTag.text(), order, data.image(), handleExcerpt(data.description()), link, handleContent(data.text()));
                                                //     handleImageLink($$, thumbnail, link), mainPost.text(), link, mainPost.text());
                                                client.set(link, JSON.stringify(ar));
                                                result.push(ar);
                                                }
                                                resolve();
                                            }
                                            done();
                                        }
                                    }]);
                                }
                                else {
                                    let ar = JSON.parse(value);
                                    ar.order = order;
                                    client.set(link, JSON.stringify(ar));
                                    result.push(ar);
                                    resolve();
                                }

                            });
                        })

                    })
                    Promise.all(a).then(() => resolve());
                    done();
                })
                promise.then(() => {
                    response.send(result.sort((a: Article, b: Article) => a.order - b.order).map((a: Article) => {
                        return a;
                    }));
                });
                promise.catch((err) => {
                    console.log(err);
                })
            }
        }
    });

    // Queue just one URL, with default callback
    c.queue('https://news.ycombinator.com/best?p=' + req.params['page']);
});

app.listen(process.env.PORT || 3000, () => {
    // client.flushdb(function (err, succeeded) {
    //     console.log(succeeded); // will be true if successfull
    // });
    // client.del('https://apnews.com/article/joe-biden-wins-white-house-ap-fd58df73aa677acb74fce2a69adb71f9');
    console.log(`server is listening on ${port}`);
}).on('error', function (err) {
    console.log(err);
});
let handleImageLink = ($: any, image: any, url: string): string  => {

    let link = new URL(url);

    let parsed = psl.parse(link.hostname);
    switch (parsed.domain) {
        case HOSTNAME.FACEBOOK:
            return ASSETS.FACEBOOK;

        case HOSTNAME.HACKERNEWS:
            return ASSETS.HACKERNEWS;

        case HOSTNAME.TWITTER:
            return ASSETS.TWITTER;

        case HOSTNAME.YOUTUBE:
            let youtubeThumbnail = require('youtube-thumbnail');
            return youtubeThumbnail(url).high.url;
        default:
            if (parsed.tld == 'github.io') {
                return ASSETS.GITHUB;
            }
            if (image) {
                let src = $(image).attr('src') == '' ? $(image).attr('data-cfsrc') : $(image).attr('src');
                if (src && src.startsWith('/'))
                    return `${new URL(url).origin}${src}`;
                else return src;
            } else return '';
    }

}

let handleExcerpt = (data: string): string => {
    if (data && data.length > 0) {
        return data.split('. ')[0];
    }
    else return '';
}
let handleContent = (data: string): any => {
    return data.replace(/\n/g, '<br>');
}
let handleThumbnail = ($: any, mainPost: any) =>  {
    let imgList = mainPost.find('figure img').toArray();

    if (imgList.length == 0) {
        imgList = mainPost.find('picture img').toArray();

        if (imgList.length == 0) {
            imgList = mainPost.find('img').toArray().filter((i) => {

                return $(i).attr('width') > 300 || parseInt($(i).css('width')) > 300 || ($(i).attr('srcset') && $(i).attr('srcset').length > 0);
            });
        }


    }
    return imgList[0] || null;
}