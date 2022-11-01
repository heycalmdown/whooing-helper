import puppeteer from 'puppeteer';

import { reformat, reorder } from './naverpay'

(async () => {
  const targetDate = new Date('2022.03.03')
  const targetAmount = 100;

  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
  });
  // console.log(await browser.wsEndpoint())
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 })
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: 'ws://127.0.0.1:55078/devtools/browser/a54e4d90-ab68-47df-b5a3-a1e0c7199e43',
  // })

  // const pages = await browser.pages()
  // console.log(pages.map(page => page.url()))
  // // const page = pages.filter(p => p.url() === 'https://order.pay.naver.com/home')[0]
  // const page = pages[0]
  await login(page)
  await page.waitForTimeout(10000);

  await printTotalPoint(page)

  const potentialContent = await gatherContent(page, targetDate)

  const content = sliceContent(potentialContent, targetDate, targetAmount)
  content.reverse().forEach(c => {
    console.log(reorder(reformat(c)).join(' '))
  })

  await browser.close();
})();

function sliceContent(potentialContent: string[][], targetDate: Date, targetAmount: number) {
  const index = potentialContent.findIndex(c => {
    const date = new Date(c[1])
    // console.log(date, targetDate, parseAmount(c[4]), targetAmount)
    return +date === +targetDate && parseAmount(c[4]) === targetAmount
  })

  return potentialContent.slice(0, index)
}

async function listContent(page: puppeteer.Page) {
  return await page.$$eval('#_listContentArea > ul > li', elements => {
    function text(e: Element, selector: string) {
      return e.querySelector(selector)?.innerHTML ?? '';
    }
    return elements.map(e => [
      text(e, '._statusName'), text(e, '.date'), text(e, '._titleName'), text(e, '.subtext'), text(e, '.amount_space .point')
    ])
  })
}

async function getInnerText(page: puppeteer.Page, selector: string) {
  const el = await page.$(selector);
  return el?.evaluate(el => el.innerText);
}

function parseAmount(text: string) {
  return parseInt(text.replace(',', ''), 10);
}

async function pageDown(page: puppeteer.Page) {
  const scrollHeight = 'document.body.scrollHeight';
  await page.evaluate(scrollHeight);
  await page.evaluate(`window.scrollTo(0, ${scrollHeight})`);
};

async function login(page: puppeteer.Page) {
  await page.goto('https://order.pay.naver.com/home?tabMenu=POINT_TOTAL');
  await page.type('#id', process.env.NAVER_ID!, { delay: 100 });
  await page.type('#pw', process.env.NAVER_PW!, { delay: 100 });
  const el = await page.$('#pw');
  await el?.press('Enter');
}

async function printTotalPoint(page: puppeteer.Page) {
  const holdPoint = parseAmount(await getInnerText(page, '#container > div > div.snb > div.member_sc > dl > dd > a > strong'))
  const expectedPoint = parseAmount(await getInnerText(page, '#_expectedAcmAmt'))
  console.log(holdPoint, expectedPoint, holdPoint + expectedPoint)
}

async function gatherContent(page: puppeteer.Page, targetDate: Date) {
  for (let i = 0; i < 100; i++) {
    const content = await listContent(page)
    if (new Date(content.slice(-1)[0][1]) < targetDate) {
      return content
    }
    await page.click('#_moreButton > a')
    await page.waitForTimeout(1000);
    await pageDown(page)
  }
  throw new Error('too many page down')
}
