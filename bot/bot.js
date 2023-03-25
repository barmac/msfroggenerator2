import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises'

const sleep = time => new Promise(resolve => setTimeout(resolve, time));
const flag = await readFile('/flag.txt', 'utf-8');

const browser = await puppeteer.launch({
    headless: false,
    pipe: true,
    dumpio: true,
    args: [
        '--incognito',
        '--js-flags=--jitless',
        '--no-sandbox'
    ],
    defaultViewport: {
        width: 1280,
        height: 720
    }
});

const visit = async () => {
    const page = await browser.newPage();
    const [url] = process.argv.slice(2);
    await page.goto('http://openresty:8080/');
    await page.evaluate(flag => {
        localStorage.setItem('flag', flag);
    }, flag);

    // @barmac
    console.log('visiting', url);

    await page.goto(url);
    await sleep(5000);
    const screenshot = await page.screenshot({
        type: 'png',
        encoding: 'base64'
    });
    await page.evaluate(async screenshot => {
        await fetch('/api/reports/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('flag')}`
            },
            body: JSON.stringify({ screenshot })
        });
    }, screenshot);
}

try { await Promise.race([ visit(), sleep(10000) ]); } catch(e) { console.log(e) };
await browser.close();