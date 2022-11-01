import puppeteer from 'puppeteer';
import { element2selector } from 'puppeteer-element2selector';
import { shuffle } from 'lodash';

interface PlayTarget {
  name: string
  url: string
  month: number
  date: string
  timeSlot: number
}

interface Person {
  name: string
  id: string
  password: string
  birthday: string
  phone: string
}

const persons: Person[] = [
  { name: '소연', id: 'jsbar60', password: 'Thduscjswo!2', birthday: '19810112', phone: '01043937493' },
  { name: '화성', id: 'xuhuaxing', password: 'xu780129', birthday: '19801001', phone: '01066172134' },
]

const plays: PlayTarget[] = [
  { name: '손', url: 'https://tickets.interpark.com/goods/22003374', month: 7, date: '12', timeSlot: 2 },
  { name: '헬멧', url: 'https://tickets.interpark.com/goods/22005131', month: 7, date: '28', timeSlot: 1 },
  // { name: '터칭', url: 'https://tickets.interpark.com/goods/22006446', month: 8, date: '5', timeSlot: 1 }, // 테스트
  { name: '터칭', url: 'https://tickets.interpark.com/goods/22006446', month: 8, date: '20', timeSlot: 1 },
  // { name: '터칭', url: 'https://tickets.interpark.com/goods/22006446', month: 8, date: '21', timeSlot: 1 },
  // { name: '터칭', url: 'https://tickets.interpark.com/goods/22006446', month: 8, date: '27', timeSlot: 2 },
];

async function pickPlay(page: puppeteer.Page, name: string) {
  const play = plays.find(p => p.name === name) || plays[0]!
  if (play.url === page.url()) return play
  await page.goto(play.url, { timeout: DEFAULT_TIMEOUT })
  await page.waitForSelector('#productSide > div > div.sideBtnWrap > a.sideBtn.is-primary > span')
  return play
}

let occupied: boolean = false;
let retried: number = 0;

(async () => {
  const person = persons[0]

  if (!process.argv[2]) {
    const browser = await launch()
    const page = await browser.newPage()
    await login(page, person)
    await page.waitForTimeout(1000)
    return
  }

  const browser = await connect()
  const pages = await browser.pages()
  const page = pages.find(p => p.url().startsWith('https://tickets.interpark.com/goods/')) ?? pages[0]!

  await page.setViewport({ width: 1280, height: 800 })

  await ensureLoggedIn(page, person)
  console.log(page.url())
  // const play = await pickPlay(page, '헬멧');
  // const play = await pickPlay(page, '손');
  const play = await pickPlay(page, '터칭');

  await step(play, page, process.argv[3] as Steps ?? 'date', person)
})();

type Steps = 'date' | 'seat' | 'book' | 'pay'

async function step(play: PlayTarget, page: puppeteer.Page, steps: Steps, person: Person) {
  switch (steps) {
    case 'date': 
      await pickDate(page, play)
    case 'seat':
      await pickSeat(await waitBookingOrToping(page))
    case 'book':
      await booking(await waitBookingOrToping(page))
    case 'pay':
      await pay(await waitBookingOrToping(page), person)
  }
}


async function waitBookingOrToping(page: puppeteer.Page): Promise<puppeteer.Page> {
  const urls = [
    'https://poticket.interpark.com/Book/BookMain.asp',
    'https://ticket.interpark.com/Ticket/Goods/GoodsTopingDisInfo.asp'
  ]
  const booking = await waitForPages(page, urls)
  if (booking.url().startsWith(urls[1])) {
    await ignoreToping(booking)
  } else {
    return booking
  }
  return waitBookingOrToping(page)
}

async function ignoreToping(page: puppeteer.Page) {
  await page.click('body > div.wrap > div.btns > a:nth-child(2) > img')
}

async function waitForPages(parent: puppeteer.Page, urls: string[]) {
  console.log('waitForPages', parent.url(), urls)
  const browser = parent.browser()!;
  for (let i = 0; i < 10000; i++) {
    const pages = await browser.pages()
    // console.log(pages.map(p => p.url()))
    const page = pages.find(p => urls.some(url => p.url().startsWith(url)))
    if (page) return page

    await parent.waitForTimeout(100)
  }
  throw new Error('timeout')
}

async function waitForFrame(page: puppeteer.Page, name: string, timeout: number = DEFAULT_TIMEOUT) {
  for (let i = 0; i < (timeout / 100); i++) {
    for (const f of page.frames()) {
      const url = f.url()
      // console.log(url, f.name(), name)
      if (url === name || f.name() === name) {
        console.log('found', name)
        return f
      }
    }
    await page.waitForTimeout(100)
  }
  return null!
}

async function clickElement(page: puppeteer.Page, element: puppeteer.ElementHandle) {
  await element.click({ delay: 100})
  await page.setViewport({ width: 1280, height: 800 })
  await page.evaluate(() => window.resizeTo(1280, 800))
}

async function clickOnFrame(page: puppeteer.Page, selector: string, frameName: string, timeout: number = DEFAULT_TIMEOUT) {
  console.log('click for', frameName)
  const f = await waitForFrame(page, frameName, timeout);
  await f.waitForSelector(selector, { timeout });
  await f.click(selector, { delay: 100 });
  await page.setViewport({ width: 1280, height: 800 })
  await page.evaluate(() => window.resizeTo(1280, 800))
}

const DEFAULT_TIMEOUT = 2 * 60 * 1000

async function click(page: puppeteer.Page, selector: string) {
  console.log('click', selector)
  await page.waitForSelector(selector, { visible: true, timeout: DEFAULT_TIMEOUT })
  await page.click(selector, { delay: 100 });
  await page.setViewport({ width: 1280, height: 800 })
  await page.evaluate(() => window.resizeTo(1280, 800))
  console.log('clicked')
}

async function select(page: puppeteer.Page, name: string, selector: string, value: string) {
  const f = await waitForFrame(page, name);
  await f.waitForSelector(selector, { timeout: DEFAULT_TIMEOUT });
  return f.select(selector, value)
}

async function title(element?: puppeteer.ElementHandle | null) {
  const jsHandle = await element?.getProperty('title')
  return jsHandle?.jsonValue() ?? ''
}

async function pickSeat(page: puppeteer.Page): Promise<void> {
  console.log('pickSeat')
  await page.setViewport({ width: 1280, height: 800 })

  const seatDetailFrame = await waitForFrame(page, 'ifrmSeatDetail')
  await seatDetailFrame.waitForSelector('#ImgSeatCount')

  const seats = await seatDetailFrame.$$('img.stySeat')
  const count = seats.length
  console.log({ count })

  if (count === 0) return

  const seat = shuffle(seats)[0]
  console.log(await title(seat))

  occupied = false

  await clickElement(page, seat)
  await clickOnFrame(page, '#NextStepImage', 'ifrmSeat')
  await page.waitForTimeout(500);

  if (occupied && retried < 10) {
    console.log('이선좌')
    retried++
    await page.waitForTimeout(500);
    return pickSeat(page)
  }
}

async function booking(page: puppeteer.Page) {
  console.log('booking')
  await select(page, 'ifrmBookStep', '#PriceRow004 > td.taL > select', '1') // 연애인 할인
  // await select(page, 'ifrmBookStep', 'select:first-child', '1')
  await click(page, '#SmallNextBtnImage')
  await page.waitForTimeout(500);
  const bookStepFrame = await waitForFrame(page, 'ifrmBookStep')
  await bookStepFrame.waitForSelector('#YYMMDD', { timeout: DEFAULT_TIMEOUT })
  await bookStepFrame.type('#YYMMDD', '810112')
  await click(page, '#SmallNextBtnImage');
}

async function pay(page: puppeteer.Page, person: Person) {
  console.log('pay')
  await select(page, 'ifrmBookStep', 'select#DiscountCard', '26011')
  await click(page, '#SmallNextBtnImage');
  await clickOnFrame(page, '#checkAll', 'ifrmBookStep');
  await click(page, '#LargeNextBtnImage');
  const overlayFrame = await waitForFrame(page, 'overlayFrame', DEFAULT_TIMEOUT)
  await overlayFrame.waitForSelector('a.btn_toss', { visible: true, timeout: DEFAULT_TIMEOUT })
  await overlayFrame.click('a.btn_toss')
  await overlayFrame.waitForSelector('#bir', { visible: true, timeout: DEFAULT_TIMEOUT })
  await overlayFrame.type('#bir', person.birthday)
  await overlayFrame.type('#hpno', person.phone)
  await overlayFrame.click('#agreeYN')
  await overlayFrame.click('#sendBtn')
  // await overlayFrame.click('#btnConfirm')
}

async function login(page: puppeteer.Page, person: Person) {
  await page.goto('https://ticket.interpark.com/Gate/TPLogin.asp?CPage=B&MN=Y&tid1=main_gnb&tid2=right_top&tid3=login&tid4=login');
  const frame = await waitForFrame(page, 'https://accounts.interpark.com/login/form')!
  await frame.waitForSelector('#userId', { timeout: DEFAULT_TIMEOUT })
  await frame.type('#userId', person.id, { delay: 100 });
  await frame.type('#userPwd', person.password, { delay: 100 });
  const el = await frame.$('#userPwd');
  await el?.press('Enter');
}

async function ensureLoggedIn(page: puppeteer.Page, person: Person) {
  await page.setViewport({ width: 1280, height: 800 })

  const hasLoginButton = await page.$('#gateway > div > div.gatewayUserMenu > ul > li.gatewayLogin > a')
  const isLoginPage = page.url().startsWith('https://ticket.interpark.com/Gate/TPLogin')
  if (hasLoginButton || isLoginPage) {
    console.log('logging in...')
    await login(page, person)
    await page.waitForTimeout(1000)
    console.log('logged in')
  } else {
    console.log('already logged in')
  }
}

async function attachDialogHandler(browser: puppeteer.Browser) {
  browser.on('targetcreated', async (target: puppeteer.Target) => {
    const page = await target.page();
    if (!page) return

    page.on('dialog', async (dialog) => {
      if (dialog.message() === '다른 고객님께서 이미 선택한 좌석 입니다.') {
        occupied = true
      }
      await dialog.accept();
    });
  });
}

async function connect() {
  const browser = await puppeteer.connect({
    browserWSEndpoint: process.argv[2],
    defaultViewport: { width: 1280, height: 800 },
    // args: ['--no-sandbox', '--disable-setuid-sandbox']
    // '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'
  })

  await attachDialogHandler(browser)
  return browser
}

// get innerText from an element
async function text(element?: puppeteer.ElementHandle | null): Promise<string> {
  const jsHandle = await element?.getProperty('innerText')
  return jsHandle?.jsonValue() ?? ''
}

async function launch() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--no-sandbox', '--disable-setuid-sandbox', '--disable-site-isolation-trials']
  });
  console.log(browser.wsEndpoint())
  return browser
}

async function pickDate(page: puppeteer.Page, play: PlayTarget) {
  const monthItem = await page.$$('#productSide > div > div.sideMain > div.sideContainer.containerTop.sideToggleWrap > div.sideContent.toggleCalendar > div > div > div > div > ul:nth-child(1) > li:nth-child(2)')
  const monthText = await text(monthItem[0].asElement())
  const currentMonth = parseInt(monthText.split(' ')[1], 10)
  console.log('month', monthText, currentMonth, play.month)
  if (currentMonth < play.month) {
    await click(page, '#productSide > div > div.sideMain > div.sideContainer.containerTop.sideToggleWrap > div.sideContent.toggleCalendar > div > div > div > div > ul:nth-child(1) > li:nth-child(3)')
    await page.waitForTimeout(500)
  } else if (currentMonth > play.month) {
    await click(page, '#productSide > div > div.sideMain > div.sideContainer.containerTop.sideToggleWrap > div.sideContent.toggleCalendar > div > div > div > div > ul:nth-child(1) > li:nth-child(1)')
    await page.waitForTimeout(500)
  }
  const dates = await page.$$('#productSide > div > div.sideMain > div.sideContainer.containerTop.sideToggleWrap > div.sideContent.toggleCalendar > div > div > div > div > ul:nth-child(3) > li:not(.disabled)')
  let date = dates[0]
  for (const d of dates) {
    if (play.date === await text(d.asElement())) {
      date = d
      break
    }
  }

  const element = date.asElement()
  const selector = await element2selector(element as any)
  await click(page, selector)
  await click(page, `li.timeTableItem:nth-child(${play.timeSlot}) > a`)
  await page.evaluate(() => {
    document.querySelector('#productSide > div > div.sideBtnWrap > a.sideBtn.is-primary > span')?.scrollIntoView()
  })
  await click(page, '#productSide > div > div.sideBtnWrap > a.sideBtn.is-primary > span')
}
