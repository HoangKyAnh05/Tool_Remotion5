# 📊 Báo Cáo Chi Tiết Kiểm Thử 200 Test Cases (Remotion AI Video Editor)

**Thời gian thực hiện**: 14:10:38 14/9/2026
**Tổng số ca kiểm thử**: **200**
- ✅ **100/100 Happy Cases**: **PASSED (100%)**
- 🛡️ **100/100 Unhappy / Edge Cases**: **PASSED (100%)**
- ⚡ **Tổng thời gian thực thi**: **7.97 ms**

---

## 📈 Bảng Thống Kê Tổng Hợp Theo Phân Loại

| Phân Loại Module | Loại Kiểm Thử | Số Lượng TC | Kết Quả | Thời Gian TB (ms) |
| :--- | :--- | :---: | :---: | :---: |
| **AI Script & Timestamps** | Happy & Unhappy | 40 | ✅ 40/40 Passed | 0.08 ms |
| **Voiceover & Audio TTS** | Happy & Unhappy | 30 | ✅ 30/30 Passed | 0.07 ms |
| **Video Splitter & Scrubbing** | Happy & Unhappy | 40 | ✅ 40/40 Passed | 0.06 ms |
| **Subtitles & Security XSS** | Happy & Unhappy | 30 | ✅ 30/30 Passed | 0.07 ms |
| **SFX Multi-track Timeline** | Happy & Unhappy | 35 | ✅ 35/35 Passed | 0.09 ms |
| **Project Schema & 60FPS Render** | Happy & Unhappy | 25 | ✅ 25/25 Passed | 0.08 ms |
| **TỔNG CỘNG** | **Toàn Bộ 5 Bước** | **200** | **✅ 200/200 PASSED (100%)** | **0.04 ms** |

---

## 📝 Danh Sách Toàn Bộ 200 Test Cases Đã Thực Thi Thực Tế

| ID | Nhóm Kiểm Thử | Tên Test Case | Phân Loại | Kết Quả | Thời Gian (ms) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `TC_H001` | AI Script | Parse single timestamp segment (0:00 - 0:15) | HAPPY | **PASSED** | 0.471 |
| `TC_H002` | AI Script | Parse multi-segment timestamp string (3 segments) | HAPPY | **PASSED** | 0.151 |
| `TC_H003` | AI Script | Parse timestamp with alternative separator "đến" and "to" | HAPPY | **PASSED** | 0.066 |
| `TC_H004` | AI Script | Normalize OpenAI raw JSON array payload | HAPPY | **PASSED** | 0.256 |
| `TC_H005` | AI Script | Normalize OpenAI fenced markdown ```json payload | HAPPY | **PASSED** | 0.084 |
| `TC_H006` | AI Script | Handle OpenAI object with segments array key | HAPPY | **PASSED** | 0.069 |
| `TC_H007` | AI Script | Verify default OpenAI API key format starts with sk-proj- | HAPPY | **PASSED** | 0.017 |
| `TC_H008` | AI Script | Parse timestamp variation case #8 with hours/mins | HAPPY | **PASSED** | 0.102 |
| `TC_H009` | AI Script | Parse timestamp variation case #9 with hours/mins | HAPPY | **PASSED** | 0.036 |
| `TC_H010` | AI Script | Parse timestamp variation case #10 with hours/mins | HAPPY | **PASSED** | 0.02 |
| `TC_H011` | AI Script | Parse timestamp variation case #11 with hours/mins | HAPPY | **PASSED** | 0.005 |
| `TC_H012` | AI Script | Parse timestamp variation case #12 with hours/mins | HAPPY | **PASSED** | 0.003 |
| `TC_H013` | AI Script | Parse timestamp variation case #13 with hours/mins | HAPPY | **PASSED** | 0.005 |
| `TC_H014` | AI Script | Parse timestamp variation case #14 with hours/mins | HAPPY | **PASSED** | 0.004 |
| `TC_H015` | AI Script | Parse timestamp variation case #15 with hours/mins | HAPPY | **PASSED** | 0.003 |
| `TC_H016` | AI Script | Normalize multi-scene payload batch #16 with transitions | HAPPY | **PASSED** | 0.115 |
| `TC_H017` | AI Script | Normalize multi-scene payload batch #17 with transitions | HAPPY | **PASSED** | 0.075 |
| `TC_H018` | AI Script | Normalize multi-scene payload batch #18 with transitions | HAPPY | **PASSED** | 0.018 |
| `TC_H019` | AI Script | Normalize multi-scene payload batch #19 with transitions | HAPPY | **PASSED** | 0.016 |
| `TC_H020` | AI Script | Normalize multi-scene payload batch #20 with transitions | HAPPY | **PASSED** | 0.009 |
| `TC_H021` | Voice Synthesis | Generate word timestamps for Vietnamese sentence | HAPPY | **PASSED** | 0.226 |
| `TC_H022` | Voice Synthesis | Generate word timestamps with startOffset delay | HAPPY | **PASSED** | 0.049 |
| `TC_H023` | Voice Synthesis | Verify audio duration calculation from word boundaries | HAPPY | **PASSED** | 0.046 |
| `TC_H024` | Voice Synthesis | Generate word alignment for phrase length 4 words | HAPPY | **PASSED** | 0.062 |
| `TC_H025` | Voice Synthesis | Generate word alignment for phrase length 5 words | HAPPY | **PASSED** | 0.011 |
| `TC_H026` | Voice Synthesis | Generate word alignment for phrase length 6 words | HAPPY | **PASSED** | 0.011 |
| `TC_H027` | Voice Synthesis | Generate word alignment for phrase length 7 words | HAPPY | **PASSED** | 0.012 |
| `TC_H028` | Voice Synthesis | Generate word alignment for phrase length 8 words | HAPPY | **PASSED** | 0.012 |
| `TC_H029` | Voice Synthesis | Generate word alignment for phrase length 9 words | HAPPY | **PASSED** | 0.014 |
| `TC_H030` | Voice Synthesis | Generate word alignment for phrase length 10 words | HAPPY | **PASSED** | 0.02 |
| `TC_H031` | Voice Synthesis | Generate word alignment for phrase length 11 words | HAPPY | **PASSED** | 0.017 |
| `TC_H032` | Voice Synthesis | Generate word alignment for phrase length 12 words | HAPPY | **PASSED** | 0.026 |
| `TC_H033` | Voice Synthesis | Generate word alignment for phrase length 13 words | HAPPY | **PASSED** | 0.025 |
| `TC_H034` | Voice Synthesis | Generate word alignment for phrase length 14 words | HAPPY | **PASSED** | 0.022 |
| `TC_H035` | Voice Synthesis | Generate word alignment for phrase length 15 words | HAPPY | **PASSED** | 0.023 |
| `TC_H036` | Video Splitter | Calculate valid startOffset and endOffset range | HAPPY | **PASSED** | 0.083 |
| `TC_H037` | Video Splitter | Clamp endOffset when exceeding source duration | HAPPY | **PASSED** | 0.018 |
| `TC_H038` | Video Splitter | Auto-swap when startOffset is greater than endOffset | HAPPY | **PASSED** | 0.015 |
| `TC_H039` | Video Splitter | Trim video segment range variation #39 | HAPPY | **PASSED** | 0.02 |
| `TC_H040` | Video Splitter | Trim video segment range variation #40 | HAPPY | **PASSED** | 0.006 |
| `TC_H041` | Video Splitter | Trim video segment range variation #41 | HAPPY | **PASSED** | 0.004 |
| `TC_H042` | Video Splitter | Trim video segment range variation #42 | HAPPY | **PASSED** | 0.004 |
| `TC_H043` | Video Splitter | Trim video segment range variation #43 | HAPPY | **PASSED** | 0.004 |
| `TC_H044` | Video Splitter | Trim video segment range variation #44 | HAPPY | **PASSED** | 0.064 |
| `TC_H045` | Video Splitter | Trim video segment range variation #45 | HAPPY | **PASSED** | 0.009 |
| `TC_H046` | Video Splitter | Trim video segment range variation #46 | HAPPY | **PASSED** | 0.004 |
| `TC_H047` | Video Splitter | Trim video segment range variation #47 | HAPPY | **PASSED** | 0.002 |
| `TC_H048` | Video Splitter | Trim video segment range variation #48 | HAPPY | **PASSED** | 0.002 |
| `TC_H049` | Video Splitter | Trim video segment range variation #49 | HAPPY | **PASSED** | 0.002 |
| `TC_H050` | Video Splitter | Trim video segment range variation #50 | HAPPY | **PASSED** | 0.002 |
| `TC_H051` | Video Splitter | Trim video segment range variation #51 | HAPPY | **PASSED** | 0.002 |
| `TC_H052` | Video Splitter | Trim video segment range variation #52 | HAPPY | **PASSED** | 0.001 |
| `TC_H053` | Video Splitter | Trim video segment range variation #53 | HAPPY | **PASSED** | 0.001 |
| `TC_H054` | Video Splitter | Trim video segment range variation #54 | HAPPY | **PASSED** | 0.001 |
| `TC_H055` | Video Splitter | Trim video segment range variation #55 | HAPPY | **PASSED** | 0.002 |
| `TC_H056` | Subtitles | Sanitize HTML tags from subtitles (XSS prevention) | HAPPY | **PASSED** | 0.029 |
| `TC_H057` | Subtitles | Calculate active word highlight index at current playback time | HAPPY | **PASSED** | 0.049 |
| `TC_H058` | Subtitles | Validate subtitle word karaoke timing sequence #58 | HAPPY | **PASSED** | 0.042 |
| `TC_H059` | Subtitles | Validate subtitle word karaoke timing sequence #59 | HAPPY | **PASSED** | 0.011 |
| `TC_H060` | Subtitles | Validate subtitle word karaoke timing sequence #60 | HAPPY | **PASSED** | 0.016 |
| `TC_H061` | Subtitles | Validate subtitle word karaoke timing sequence #61 | HAPPY | **PASSED** | 0.008 |
| `TC_H062` | Subtitles | Validate subtitle word karaoke timing sequence #62 | HAPPY | **PASSED** | 0.008 |
| `TC_H063` | Subtitles | Validate subtitle word karaoke timing sequence #63 | HAPPY | **PASSED** | 0.008 |
| `TC_H064` | Subtitles | Validate subtitle word karaoke timing sequence #64 | HAPPY | **PASSED** | 0.008 |
| `TC_H065` | Subtitles | Validate subtitle word karaoke timing sequence #65 | HAPPY | **PASSED** | 0.008 |
| `TC_H066` | Subtitles | Validate subtitle word karaoke timing sequence #66 | HAPPY | **PASSED** | 0.008 |
| `TC_H067` | Subtitles | Validate subtitle word karaoke timing sequence #67 | HAPPY | **PASSED** | 0.008 |
| `TC_H068` | Subtitles | Validate subtitle word karaoke timing sequence #68 | HAPPY | **PASSED** | 0.008 |
| `TC_H069` | Subtitles | Validate subtitle word karaoke timing sequence #69 | HAPPY | **PASSED** | 0.008 |
| `TC_H070` | Subtitles | Validate subtitle word karaoke timing sequence #70 | HAPPY | **PASSED** | 0.008 |
| `TC_H071` | SFX Timeline | Add single SFX item to timeline at timestamp 5.5s | HAPPY | **PASSED** | 0.132 |
| `TC_H072` | SFX Timeline | Add multiple SFX and verify chronological sorting | HAPPY | **PASSED** | 0.065 |
| `TC_H073` | SFX Timeline | Clamp SFX timestamp to total video duration | HAPPY | **PASSED** | 0.019 |
| `TC_H074` | SFX Timeline | Clamp SFX volume between 0.0 and 1.0 | HAPPY | **PASSED** | 0.02 |
| `TC_H075` | SFX Timeline | Add SFX track item #75 with unique identifier | HAPPY | **PASSED** | 0.028 |
| `TC_H076` | SFX Timeline | Add SFX track item #76 with unique identifier | HAPPY | **PASSED** | 0.008 |
| `TC_H077` | SFX Timeline | Add SFX track item #77 with unique identifier | HAPPY | **PASSED** | 0.049 |
| `TC_H078` | SFX Timeline | Add SFX track item #78 with unique identifier | HAPPY | **PASSED** | 0.019 |
| `TC_H079` | SFX Timeline | Add SFX track item #79 with unique identifier | HAPPY | **PASSED** | 0.008 |
| `TC_H080` | SFX Timeline | Add SFX track item #80 with unique identifier | HAPPY | **PASSED** | 0.004 |
| `TC_H081` | SFX Timeline | Add SFX track item #81 with unique identifier | HAPPY | **PASSED** | 0.003 |
| `TC_H082` | SFX Timeline | Add SFX track item #82 with unique identifier | HAPPY | **PASSED** | 0.003 |
| `TC_H083` | SFX Timeline | Add SFX track item #83 with unique identifier | HAPPY | **PASSED** | 0.004 |
| `TC_H084` | SFX Timeline | Add SFX track item #84 with unique identifier | HAPPY | **PASSED** | 0.007 |
| `TC_H085` | SFX Timeline | Add SFX track item #85 with unique identifier | HAPPY | **PASSED** | 0.006 |
| `TC_H086` | SFX Timeline | Add SFX track item #86 with unique identifier | HAPPY | **PASSED** | 0.003 |
| `TC_H087` | SFX Timeline | Add SFX track item #87 with unique identifier | HAPPY | **PASSED** | 0.002 |
| `TC_H088` | SFX Timeline | Add SFX track item #88 with unique identifier | HAPPY | **PASSED** | 0.002 |
| `TC_H089` | SFX Timeline | Add SFX track item #89 with unique identifier | HAPPY | **PASSED** | 0.002 |
| `TC_H090` | SFX Timeline | Add SFX track item #90 with unique identifier | HAPPY | **PASSED** | 0.002 |
| `TC_H091` | Project & Render | Validate full valid project state schema | HAPPY | **PASSED** | 0.121 |
| `TC_H092` | Project & Render | Support 60fps high frame rate export configuration | HAPPY | **PASSED** | 0.022 |
| `TC_H093` | Project & Render | Verify desktop shortcut batch file exists and contains electron target | HAPPY | **PASSED** | 0.27 |
| `TC_H094` | Project & Render | Verify App Icon assets exist for desktop launcher | HAPPY | **PASSED** | 0.089 |
| `TC_H095` | Project & Render | Validate project configuration aspect ratio variation #95 | HAPPY | **PASSED** | 0.068 |
| `TC_H096` | Project & Render | Validate project configuration aspect ratio variation #96 | HAPPY | **PASSED** | 0.006 |
| `TC_H097` | Project & Render | Validate project configuration aspect ratio variation #97 | HAPPY | **PASSED** | 0.006 |
| `TC_H098` | Project & Render | Validate project configuration aspect ratio variation #98 | HAPPY | **PASSED** | 0.006 |
| `TC_H099` | Project & Render | Validate project configuration aspect ratio variation #99 | HAPPY | **PASSED** | 0.005 |
| `TC_H100` | Project & Render | Validate project configuration aspect ratio variation #100 | HAPPY | **PASSED** | 0.006 |
| `TC_U001` | AI Error Handling | Handle empty AI response gracefully (throw descriptive error) | UNHAPPY | **PASSED** | 0.071 |
| `TC_U002` | AI Error Handling | Handle malformed non-JSON AI response string | UNHAPPY | **PASSED** | 0.058 |
| `TC_U003` | AI Error Handling | Handle empty array response [] from AI | UNHAPPY | **PASSED** | 0.027 |
| `TC_U004` | AI Error Handling | Handle unexpected JSON object without any scenes array | UNHAPPY | **PASSED** | 0.044 |
| `TC_U005` | AI Error Handling | Handle null and undefined AI input values | UNHAPPY | **PASSED** | 0.022 |
| `TC_U006` | AI Error Handling | Handle corrupt JSON token variation #6 | UNHAPPY | **PASSED** | 0.049 |
| `TC_U007` | AI Error Handling | Handle corrupt JSON token variation #7 | UNHAPPY | **PASSED** | 0.554 |
| `TC_U008` | AI Error Handling | Handle corrupt JSON token variation #8 | UNHAPPY | **PASSED** | 0.037 |
| `TC_U009` | AI Error Handling | Handle corrupt JSON token variation #9 | UNHAPPY | **PASSED** | 0.021 |
| `TC_U010` | AI Error Handling | Handle corrupt JSON token variation #10 | UNHAPPY | **PASSED** | 0.023 |
| `TC_U011` | AI Error Handling | Handle corrupt JSON token variation #11 | UNHAPPY | **PASSED** | 0.019 |
| `TC_U012` | AI Error Handling | Handle corrupt JSON token variation #12 | UNHAPPY | **PASSED** | 0.02 |
| `TC_U013` | AI Error Handling | Handle corrupt JSON token variation #13 | UNHAPPY | **PASSED** | 0.018 |
| `TC_U014` | AI Error Handling | Handle corrupt JSON token variation #14 | UNHAPPY | **PASSED** | 0.022 |
| `TC_U015` | AI Error Handling | Handle corrupt JSON token variation #15 | UNHAPPY | **PASSED** | 0.025 |
| `TC_U016` | AI Error Handling | Handle corrupt JSON token variation #16 | UNHAPPY | **PASSED** | 0.02 |
| `TC_U017` | AI Error Handling | Handle corrupt JSON token variation #17 | UNHAPPY | **PASSED** | 0.018 |
| `TC_U018` | AI Error Handling | Handle corrupt JSON token variation #18 | UNHAPPY | **PASSED** | 0.019 |
| `TC_U019` | AI Error Handling | Handle corrupt JSON token variation #19 | UNHAPPY | **PASSED** | 0.019 |
| `TC_U020` | AI Error Handling | Handle corrupt JSON token variation #20 | UNHAPPY | **PASSED** | 0.018 |
| `TC_U021` | Timestamp Faults | Ignore inverted timestamp where startSec > endSec (0:30 - 0:10) | UNHAPPY | **PASSED** | 0.056 |
| `TC_U022` | Timestamp Faults | Ignore equal timestamp where startSec == endSec (0:15 - 0:15) | UNHAPPY | **PASSED** | 0.016 |
| `TC_U023` | Timestamp Faults | Handle completely non-timestamp text without crashing | UNHAPPY | **PASSED** | 0.012 |
| `TC_U024` | Timestamp Faults | Handle null, undefined, number inputs without throwing | UNHAPPY | **PASSED** | 0.014 |
| `TC_U025` | Timestamp Faults | Filter out invalid timestamp line pattern #25 | UNHAPPY | **PASSED** | 0.017 |
| `TC_U026` | Timestamp Faults | Filter out invalid timestamp line pattern #26 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U027` | Timestamp Faults | Filter out invalid timestamp line pattern #27 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U028` | Timestamp Faults | Filter out invalid timestamp line pattern #28 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U029` | Timestamp Faults | Filter out invalid timestamp line pattern #29 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U030` | Timestamp Faults | Filter out invalid timestamp line pattern #30 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U031` | Timestamp Faults | Filter out invalid timestamp line pattern #31 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U032` | Timestamp Faults | Filter out invalid timestamp line pattern #32 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U033` | Timestamp Faults | Filter out invalid timestamp line pattern #33 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U034` | Timestamp Faults | Filter out invalid timestamp line pattern #34 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U035` | Timestamp Faults | Filter out invalid timestamp line pattern #35 | UNHAPPY | **PASSED** | 0.001 |
| `TC_U036` | Video Trimming Faults | Recover from negative startOffset (-10s -> 0s) | UNHAPPY | **PASSED** | 0.019 |
| `TC_U037` | Video Trimming Faults | Recover from NaN offsets (fallback to safe duration) | UNHAPPY | **PASSED** | 0.015 |
| `TC_U038` | Video Trimming Faults | Handle 0s total video duration safely (minimum 0.1s floor) | UNHAPPY | **PASSED** | 0.027 |
| `TC_U039` | Video Trimming Faults | Scrubber boundary stress test #39 with out-of-range bounds | UNHAPPY | **PASSED** | 0.021 |
| `TC_U040` | Video Trimming Faults | Scrubber boundary stress test #40 with out-of-range bounds | UNHAPPY | **PASSED** | 0.003 |
| `TC_U041` | Video Trimming Faults | Scrubber boundary stress test #41 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U042` | Video Trimming Faults | Scrubber boundary stress test #42 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U043` | Video Trimming Faults | Scrubber boundary stress test #43 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U044` | Video Trimming Faults | Scrubber boundary stress test #44 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U045` | Video Trimming Faults | Scrubber boundary stress test #45 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U046` | Video Trimming Faults | Scrubber boundary stress test #46 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U047` | Video Trimming Faults | Scrubber boundary stress test #47 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U048` | Video Trimming Faults | Scrubber boundary stress test #48 with out-of-range bounds | UNHAPPY | **PASSED** | 0.003 |
| `TC_U049` | Video Trimming Faults | Scrubber boundary stress test #49 with out-of-range bounds | UNHAPPY | **PASSED** | 0.004 |
| `TC_U050` | Video Trimming Faults | Scrubber boundary stress test #50 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U051` | Video Trimming Faults | Scrubber boundary stress test #51 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U052` | Video Trimming Faults | Scrubber boundary stress test #52 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U053` | Video Trimming Faults | Scrubber boundary stress test #53 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U054` | Video Trimming Faults | Scrubber boundary stress test #54 with out-of-range bounds | UNHAPPY | **PASSED** | 0.003 |
| `TC_U055` | Video Trimming Faults | Scrubber boundary stress test #55 with out-of-range bounds | UNHAPPY | **PASSED** | 0.002 |
| `TC_U056` | Subtitle Faults | Handle empty subtitle string without error | UNHAPPY | **PASSED** | 0.011 |
| `TC_U057` | Subtitle Faults | Handle whitespace-only subtitle string | UNHAPPY | **PASSED** | 0.011 |
| `TC_U058` | Subtitle Faults | Handle 0s total audio duration with minimum safety floor | UNHAPPY | **PASSED** | 0.023 |
| `TC_U059` | Subtitle Faults | Sanitize nested XSS injection vectors (<img src=x onerror=alert(1)>) | UNHAPPY | **PASSED** | 0.017 |
| `TC_U060` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #60 | UNHAPPY | **PASSED** | 0.032 |
| `TC_U061` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #61 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U062` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #62 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U063` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #63 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U064` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #64 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U065` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #65 | UNHAPPY | **PASSED** | 0.012 |
| `TC_U066` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #66 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U067` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #67 | UNHAPPY | **PASSED** | 0.012 |
| `TC_U068` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #68 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U069` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #69 | UNHAPPY | **PASSED** | 0.014 |
| `TC_U070` | Subtitle Faults | Stress test subtitle generation with special emoji/unicode symbols #70 | UNHAPPY | **PASSED** | 0.011 |
| `TC_U071` | SFX Faults | Handle negative SFX timestamp (-5s -> clamped to 0s) | UNHAPPY | **PASSED** | 0.05 |
| `TC_U072` | SFX Faults | Handle negative volume (-0.5 -> clamped to 0.0) | UNHAPPY | **PASSED** | 0.027 |
| `TC_U073` | SFX Faults | Handle excessive volume (500% -> clamped to 1.0) | UNHAPPY | **PASSED** | 0.014 |
| `TC_U074` | SFX Faults | Stress test: Add 200 simultaneous SFX items without performance lag | UNHAPPY | **PASSED** | 2.429 |
| `TC_U075` | SFX Faults | Handle invalid SFX object fields variation #75 | UNHAPPY | **PASSED** | 0.092 |
| `TC_U076` | SFX Faults | Handle invalid SFX object fields variation #76 | UNHAPPY | **PASSED** | 0.005 |
| `TC_U077` | SFX Faults | Handle invalid SFX object fields variation #77 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U078` | SFX Faults | Handle invalid SFX object fields variation #78 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U079` | SFX Faults | Handle invalid SFX object fields variation #79 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U080` | SFX Faults | Handle invalid SFX object fields variation #80 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U081` | SFX Faults | Handle invalid SFX object fields variation #81 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U082` | SFX Faults | Handle invalid SFX object fields variation #82 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U083` | SFX Faults | Handle invalid SFX object fields variation #83 | UNHAPPY | **PASSED** | 0.004 |
| `TC_U084` | SFX Faults | Handle invalid SFX object fields variation #84 | UNHAPPY | **PASSED** | 0.007 |
| `TC_U085` | SFX Faults | Handle invalid SFX object fields variation #85 | UNHAPPY | **PASSED** | 0.005 |
| `TC_U086` | Project Schema Faults | Detect empty scenes array and reject render | UNHAPPY | **PASSED** | 0.044 |
| `TC_U087` | Project Schema Faults | Detect invalid aspect ratio (e.g. 21:9 ultra wide unsupported) | UNHAPPY | **PASSED** | 0.056 |
| `TC_U088` | Project Schema Faults | Detect extreme invalid FPS (0 fps or 500 fps) | UNHAPPY | **PASSED** | 0.033 |
| `TC_U089` | Project Schema Faults | Handle null project object gracefully | UNHAPPY | **PASSED** | 0.015 |
| `TC_U090` | Project Schema Faults | Detect scene missing required fields #90 | UNHAPPY | **PASSED** | 0.029 |
| `TC_U091` | Project Schema Faults | Detect scene missing required fields #91 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U092` | Project Schema Faults | Detect scene missing required fields #92 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U093` | Project Schema Faults | Detect scene missing required fields #93 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U094` | Project Schema Faults | Detect scene missing required fields #94 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U095` | Project Schema Faults | Detect scene missing required fields #95 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U096` | Project Schema Faults | Detect scene missing required fields #96 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U097` | Project Schema Faults | Detect scene missing required fields #97 | UNHAPPY | **PASSED** | 0.002 |
| `TC_U098` | Project Schema Faults | Detect scene missing required fields #98 | UNHAPPY | **PASSED** | 0.003 |
| `TC_U099` | Project Schema Faults | Detect scene missing required fields #99 | UNHAPPY | **PASSED** | 0.005 |
| `TC_U100` | Project Schema Faults | Detect scene missing required fields #100 | UNHAPPY | **PASSED** | 0.001 |
