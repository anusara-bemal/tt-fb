import puppeteer from 'puppeteer'
import moment from 'moment'
import delay from 'delay'
import fs from 'fs-extra'
import path from 'path'

const browserHide = false
const browserPageOpt = { waitUntil: 'networkidle0' }
const browserOptions = {
  // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: browserHide,
  args: [
    '--start-maximized',
    '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"'
  ]
}

const uploadButtonSelector = `/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div[1]/div/div/div`
const nextButtonSelector = `/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div/div/div/div[1]/div/span`
const nextButtonSelector2 = `/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div[2]/div[1]/div/div[1]/div/span/span`
const textAreaSelector =  `/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div/div/div[1]/div[1]/div[1]`
const publishButtonSelector = `/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div[2]/div[1]/div/div[1]/div/span`

function checkSession() {
    return new Promise(async (resolve, reject) => {
      try {
        const fullPath = path.resolve("./cookies.json");
        const cookies = JSON.parse(await fs.readFile(fullPath))
        if (cookies.length !== 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      } catch (err) {
        resolve(false)
      }
    })
  }

function printLog(str) {
    const date = moment().format('HH:mm:ss')
    console.log(`[${date}] ${str}`)
}

export const ReelsUpload = (namafile, caption) => new Promise(async (resolve) => {
  const browser = await puppeteer.launch(browserOptions)
  const page = await browser.newPage()
  const resCheckSession = await checkSession()
  if (resCheckSession) {
    printLog('Sesi ditemukan, mencoba mengakses Facebook.')
    const fullPath = path.resolve("./cookies.json");
    await page.setCookie(...JSON.parse(await fs.readFile(fullPath)))
    try {
      await page.goto('https://www.facebook.com/reels/create', browserPageOpt)
      printLog("Berhasil membuka Facebook.")
      const uploadElement = await page.$x(uploadButtonSelector);
      const [filechooser] = await Promise.all([
      page.waitForFileChooser(),
      await uploadElement[0].click()
      ])
      await delay(2000)
      const fullPath = path.resolve(`./download/${namafile}.mp4`);
      filechooser.accept([fullPath])
      printLog(`Sukses mengunggah video ${namafile}.`)
      await delay(20000)
      const nextElement = await page.$x(nextButtonSelector);
      await nextElement[0].click()
      await delay(20000)
      const nextElement2 = await page.$x(nextButtonSelector2);
      await nextElement2[0].click()
      await delay(20000)
      const usernameElement = await page.$x(textAreaSelector);
      await usernameElement[0].click();
      await usernameElement[0].type(`${caption}`);
      printLog("Menulis caption untuk video.")
      await delay(10000)
      const PostButton = await page.$x(publishButtonSelector);
      await PostButton[0].click()
      printLog("Mencoba publish video.", 'yellow')
      await page.waitForNavigation({timeout: 100000})
      await browser.close()
      printLog("Berhasil.")
      return resolve({
        status: "success",
        message: "Video berhasil dipublikasikan!"
      })
    } catch (err) {
        printLog(err)
        await browser.close()
        return resolve({
          status: "error",
          message: "Video gagal dipublikasikan!"
      })
    }
  } else {
    await browser.close()
    const err = 'Sesi tidak ditemukan.'
    printLog(err)
    return resolve({
      status: "error",
      message: err
  })
  }
})
