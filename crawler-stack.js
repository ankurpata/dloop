


const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');
const isURL = require('validator/lib/isURL');

const URL_TO_SCRAPE = `https://www.wikipedia.org/`;


//Returns all urls of depth upto 3 using queue
const scrapper = async (targetUrl, depth, depthArg) => {

    console.log('scrapper called', targetUrl, depth);

    //Return if depth is greater than depthArg
    if (depth > depthArg) return;

    let $;
    try {
        //Get the page
        const pageResponse = await axios.get(targetUrl);
        //Load the page
        $ = cheerio.load(pageResponse.data);
    } catch (e) {
        console.log(e.message, 'error @ scrapper - targetUrl, depth', targetUrl, depth);
        return;
    }

    const data = [];

    //Find all links and save them to variable

    $("a").each((i, link) => {
        const url = $(link).attr('href')?.trim();
        if (!url) return;
        console.log(url, 'url');
        if (isURL(url)) {
            urlStack.push({ url, depth: depth + 1 });
        } else {
            console.log('invalid url', url);
        }
    })

    //Find all images and save them to variable
    $('img').map((i, el) => {
        data.push({
            imageUrl: $(el).attr('src'),
            depth,
            sourceUrl: targetUrl
        });
    });


    //Write data to file.
    // TODO: Write to file only once at the end of the program
    // OR use a database like redis.
    const fileData = await fs.readFileSync('output.json', 'utf8');
    const fileDataJson = JSON.parse(fileData);
    const newData = [...fileDataJson, ...data];
    await fs.writeFileSync('output.json', JSON.stringify(newData));
}

const urlStack = [];
const visitedUrls = {};

(async function () {

    const urlArg = process.argv[2];
    const depthArg = process.argv[3] || 3;

    urlStack.push({ url: (urlArg || URL_TO_SCRAPE), depth: 0 });

    while (urlStack.length > 0) {
        const { url, depth } = urlStack.pop();

        if (visitedUrls[url]) continue;
        await scrapper(url, depth, depthArg);
        visitedUrls[url] = true;

        console.log('Total Stack size : ', urlStack.length);
        console.log('Total URLS scanned : ', Object.keys(visitedUrls).length);
    }

    console.log('Done');
})();


