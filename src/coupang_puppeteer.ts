import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import _ from 'lodash'

import { kurlyToWhooing } from './kurly'

// puppeteer.use(StealthPlugin());

(async () => {
  const targetDate = fridayWeekAgo()

  const browser = await puppeteer.launch({
    headless: false,
    // devtools: true,
    // executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
  });
  // console.log(await browser.wsEndpoint())
  // return

  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: 'ws://127.0.0.1:54049/devtools/browser/0e8ae82a-3086-4b55-a230-7d4bd40b356e',
  // })
  const page = await browser.newPage();
  // const pages = await browser.pages()
  // console.log(pages.map(page => page.url()))
  // // const page = pages.filter(p => p.url() === 'https://order.pay.naver.com/home')[0]
  // const page = pages[0]
  await page.setViewport({ width: 1280, height: 800 })

  await login(page)

  const purchasedAt = await Promise.all(_.range(1, 11).map(async i => {
    const date = await page.$eval(`#viewOrderList > ul > li:nth-child(${i})`, e => e.querySelector('.date')?.innerHTML)
    return new Date(date || '2020-01-01')
  }))

  const purchasedLastWeek = purchasedAt.filter(d => d.getTime() > targetDate.getTime())
  const whooingItems: string[] = []

  for (let i = 0; i < purchasedLastWeek.length; i++) {
    const items = await fetchWhooingItems(page, i + 1)
    whooingItems.push(...items)
    await page.goBack({ waitUntil: 'networkidle2' })
  }
  whooingItems.forEach(item => console.log(item))

  await browser.close()
})();

function fridayWeekAgo() {
  const date = new Date()
  // date.setDate(date.getDate() - date.getDay() + 5)
  date.setDate(date.getDate() - 7)
  return date
}

async function fetchWhooingItems(page: puppeteer.Page, i: number) {
  await page.$eval(`#viewOrderList > ul > li:nth-child(${i})`, e => e.scrollIntoView(false))
  await page.click(`#viewOrderList > ul > li:nth-child(${i}) > div.order_goods > div.name > a`, { delay: 100 });
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  return pickWhooingItems(page)
}

async function pickWhooingItems(page: puppeteer.Page) {
  const content = await listContent(page)
  const dateTime = await page.$$eval('#content > div.page_aticle.aticle_type2 > div.page_section.section_orderview > table:nth-child(9) > tbody > tr:nth-child(4) > td', elements => {
    return elements[0].innerHTML
  })
  const date = dateTime.split(' ')[0]
  console.log(date)
  const discount = await page.$$eval('#paper_emoney', els => els[0].innerHTML)
  content.push(['할인', `${-parseAmount(discount)}`])
  const items = content.map(row => kurlyToWhooing(row.join('\n'), date))
  return items
}

async function listContent(page: puppeteer.Page) {
  return await page.$$eval('#content > div.page_aticle.aticle_type2 > div.page_section.section_orderview > form > table > tbody > tr', elements => {
    function text(e: Element, selector: string) {
      return e.querySelector(selector)?.innerHTML ?? '';
    }
    return elements.map(e => [
      text(e, '.name .link'), text(e, '.price')
    ])
  })
}

function parseAmount(text: string) {
  return parseInt(text.replace(',', ''), 10);
}

async function login(page: puppeteer.Page) {
  await page.goto('https://rocketpay.coupang.com/rocketpay/mypage', { waitUntil: 'networkidle0'});
  await page.type('#login-email-input', process.env.COUPANG_ID!, { delay: 100 });
  await page.type('#login-password-input', process.env.COUPANG_PW!, { delay: 100 });
  await page.click('body > div.member-wrapper.member-wrapper--flex > div > div > form > div.login__content.login__content--trigger > button', { delay: 100 });
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}
