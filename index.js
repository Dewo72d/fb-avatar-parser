//pptr
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
//modules
const fse = require("fs-extra");
const req = require("request");
const md5 = require("md5");
//consumable
const usersAPI =
    "https://get-array-of-id.com/";

const mobileConfig = {
    width: Math.floor(Math.random() * (500 - 200) + 200),
    height: Math.floor(Math.random() * (800 - 500) + 800),
    deviceScaleFactor: 2.0,
    hasTouch: true,
    isMobile: true,
    isLandscape: false,
};
(main = async () => {
    //---------------- START SETUP ------------
    puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox" /*`--proxy-server=${host}:${port}`*/],
    });

    //---------------- END SETUP ------------

    //---------------- PARS ----------------
    const parser = async (users) => {
        for (let count = 0; count < users.length; count++) {
            try {
                const idName = users[count];

                const page = await browser.newPage();
                await page.setViewport(mobileConfig);

                await page.goto(
                    "https://www.facebook.com/profile.php?id=" + users[count]
                );

                await page.waitForSelector("image");
                await page.click("image");
                await page.waitForSelector("img[data-visualcompletion]");

                const photoSrc = await page.$eval(
                    "img[data-visualcompletion]",
                    (element) => element.src
                );

                const picture = await page.goto(await photoSrc, {
                    waitUntil: "networkidle0",
                });
                //---------------- END PARS ----------------

                //---------------- SAVE & CLOSE ----------------
                await fse.outputFile(
                    `./${idName}/${md5(await picture.buffer())}.png`,
                    await picture.buffer()
                );
                console.log(idName);
                await page.close();
                //---------------- END SAVE & CLOSE ----------------
            } catch (err) {
                console.log("ERROR >>> " + err);
                await browser.close();
                main();
            }
        }
    };

    req(usersAPI, async (err, res, rawUsers) => {
        if (err) {
            await browser.close();
            throw "REQUEST ERROR >>> " + err;
        }

        if (rawUsers.length !== 0) {
            const users = JSON.parse(rawUsers);
            await parser(users);
            await browser.close();
            main();
        }
    });
})();
