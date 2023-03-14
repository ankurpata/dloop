


const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');
const isURL = require('validator/lib/isURL');

const URL_TO_SCRAPE = `https://www.houzae.com/ae/rent`;


//Returns all urls of depth upto 3 using queue
const scrapper = async (targetUrl, depth, maxDepth) => {

    //Return if depth is greater than 2
    if (depth > maxDepth) return;
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
    const links = [];
    $("a").each((i, link) => {
        const url = $(link).attr('href')?.trim();
        if (!url) return;
        console.log(url, 'url');
        if (isURL(url)) {
            links.push(url);
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
    const fileData = await fs.readFileSync('output.json', 'utf8');
    const fileDataJson = JSON.parse(fileData);
    const newData = [...fileDataJson, ...data];
    await fs.writeFileSync('output.json', JSON.stringify(newData));

    //Recursively call the function for all links
    console.log(links, 'all links', depth);
    for (const i in links) {
        await scrapper(links[i], depth + 1, maxDepth);
    }
}



const data = [];

(async function () {
    const urlArg = process.argv[2];
    const depthArg = process.argv[3];
    console.log(urlArg, depthArg, 'urlArg, depthArg');
    await scrapper((urlArg || URL_TO_SCRAPE), 0, depthArg || 3) // 3 is the max default depth
    console.log('Done');
})();


