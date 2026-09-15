from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1400, 'height': 900})
    page.goto('http://localhost:5173')
    page.wait_for_timeout(2000)
    
    # 1. Open media modal
    page.get_by_role('button', name='Video', exact=True).first.click()
    page.wait_for_timeout(2000)
    
    # 2. Click '✓ Chọn'
    page.locator('text=✓ Chọn').first.click(force=True)
    page.wait_for_timeout(2000)
    
    # 3. Click the specific Scene Trimmer button
    page.locator('button[title*="Mở bảng kéo cắt trực quan"]').first.click(force=True)
    page.wait_for_timeout(2000)
    
    # 4. Screenshot the Scene Video Trimmer Modal
    page.screenshot(path='C:/Users/Admin/.gemini/antigravity-ide/brain/ca400a9d-1cd1-4205-a917-246aad7f4d30/output_scene_video_trimmer_modal.png')
    
    browser.close()
print('Scene Video Trimmer Modal screenshot captured!')
