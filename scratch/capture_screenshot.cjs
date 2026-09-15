const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outputPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d56e32d1-d6e2-4b29-b724-28f1da329b47\\real_ai_output_screenshot.png';

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 950,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    console.log('Loading app URL...');
    await win.loadURL('http://127.0.0.1:5173');
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Opening Video Splitter modal and triggering AI...');
    await win.webContents.executeJavaScript(`
      (() => {
        const btnSplitter = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('Cắt Video') || 
          b.textContent.includes('Video Splitter') || 
          b.textContent.includes('Phân cảnh')
        );
        if (btnSplitter) btnSplitter.click();
      })();
    `);

    await new Promise((r) => setTimeout(r, 1000));

    console.log('Typing topic and triggering AI...');
    await win.webContents.executeJavaScript(`
      (async () => {
        const input = document.querySelector('input[placeholder*="Đánh giao lưu"], input[placeholder*="Chủ đề"]');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, "Video nhảy nhạc trend trung quốc");
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        await new Promise(r => setTimeout(r, 600));
        
        const aiBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('AI Gợi Ý Mốc')
        );
        if (aiBtn) {
          aiBtn.click();
        }
      })();
    `);

    console.log('Waiting for AI generation and table rendering...');
    for (let i = 0; i < 35; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await win.webContents.executeJavaScript(`
        (() => {
          const rows = document.querySelectorAll('table tbody tr');
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI Gợi Ý') || b.textContent.includes('Phân Tích'));
          const isDone = btn && !btn.textContent.includes('Phân Tích');
          return { count: rows.length, isDone };
        })()
      `);
      if (status.count > 0 && status.isDone) {
        console.log(`Table rendered with ${status.count} rows and finished after ${i + 1}s!`);
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Scroll modal down to display table nicely
    await win.webContents.executeJavaScript(`
      const modalScroll = document.querySelector('.overflow-y-auto');
      if (modalScroll) modalScroll.scrollTop = 180;
    `);

    await new Promise((r) => setTimeout(r, 1000));

    console.log('Capturing screenshot...');
    const image = await win.webContents.capturePage();
    fs.writeFileSync(outputPath, image.toPNG());
    console.log('Screenshot saved successfully to:', outputPath);
    app.quit();
  } catch (err) {
    console.error('Screenshot error:', err);
    app.quit();
  }
});
