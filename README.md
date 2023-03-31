# msfroggenerator2 writeup

This is a writeup for PicoCTF 2023 web challenge msfroggenerator2 in which I participated as a member of [Cwiercglowki](https://play.picoctf.org/teams/5897).

Check out [exploit.py](./exploit.py) for the exploit code or continue reading for a written description.

## Description

The application uses [openresty/nginx](./openresty/web.conf) to expose 3 applications:

1. [Designer](./openresty/static) is a static website which allows to draw an image of a frog with decorators.
2. [Api](./api) exposes a few endpoints which are used by the designer to save and load designs.
3. [Bot](./bot) exposes a single endpoint which triggers [puppeteer](https://pptr.dev/) to open a provided design, take a screenshot of it, and save it to the api application.

## Solution

### Parameter pollution

The entry point of the challenge is the `/report` endpoint. It is configured in [openresty](./openresty/web.conf) as follows:

```conf
location = /report {
    proxy_set_header Host bot;
    set_by_lua $url 'return "http://openresty:8080/?id=" .. ngx.var.arg_id';
    proxy_pass "http://traefik:8080/?url=$url";
    # for http://localhost:8080/report?id=1
    # http://openresty:8080/?id=1
    # http://traefik:8080/?url=http://openresty:8080/?id=1
}
```

Nginx reads given `id` parameter and appends it to a hard-coded URL which in the end creates a URL supposed to be opened by the bot.
However, we can prepare the parameter so that the `url` parameter is provided twice:

```sh
curl "$HOST/report?id=anything;url=$PAYLOAD"
```

This allowed us to make the bot open any URL we wanted.

### Make bot take a screenshot of the flag

We could make the bot open the flag file by providing `file:///flag.txt` as the URL.
However, it never saved the screenshot via api app because of the way the screenshot was sent:

```javascript
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
```

The script above was evaluated in the opened page, and localStorage was not available from the `file:///flag.txt`.

### Stored exploit

I noticed that `file://` protocol can be used in an iframe if opened from another `file://` protocol page. Therefore, it was possible to display flag on a page via `<iframe src="file:///flag.txt"></iframe>`.

First, we needed to make the bot download the exploit which was achieved via `load_exploit` function in the [exploit.py](./exploit.py). This relies on a download link clicked via script which is embedded via data URL.

We were able to display the flag on a controlled page for the screenshot to be taken. However, we couldn't send its contents to a controlled webhook.

### Race condition

We noticed that there is a delay between the screenshot and evaluation of the fetch script. Thus, the scenario of the final exploit came:

1. We open a page with flag embedded in an iframe
2. Bot takes a screenshot
3. We navigate to the Designer app
4. Bot sends the screenshot

This is what was achieved in [exploit.py](./exploit.py).

As we couldn't tell (or at least I don't know a way to) when exactly the screenshot was taken, we relied on a timeout to trigger navigation. This is the reason why the exploit is quite unreliable. You may need to adjust the timeout.

In the end, we were able to take and store a screenshot of the flag.
