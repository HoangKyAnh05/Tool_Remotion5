# 🎙️ HƯỚNG DẪN HUẤN LUYỆN (TRAIN) MÔ HÌNH GIỌNG ĐỌC PIPER VITS CHO TOOL REMOTION5

Bộ công cụ này giúp bạn tự tạo và huấn luyện mô hình giọng đọc AI Neural (.onnx) cho bất kỳ ai (Độ Mixi, PewPew, Duy Nến, Shark Hưng, hoặc chính giọng của bạn).

---

## 📁 BƯỚC 1: CHUẨN BỊ DỮ LIỆU ÂM THANH (DATASET)

1. Chuẩn bị 1 file âm thanh thu âm giọng nói rõ ràng (`.mp3` hoặc `.wav`) độ dài từ 15 đến 30 phút, không có nhạc nền hay tạp âm.
2. Chạy lệnh tự động cắt nhỏ âm thanh thành các đoạn 3 - 6 giây:

```bash
python scripts/trainer/prepare_dataset.py --audio "E:/audio_domixi.mp3" --name domixi
```

3. Lệnh trên sẽ tự động tạo thư mục:
   - `dataset/domixi/wavs/` (Chứa các file âm thanh đã cắt nhỏ)
   - `dataset/domixi/metadata.csv` (File khớp chữ với âm thanh)

---

## 🚀 BƯỚC 2: HUẤN LUYỆN (TRAIN) MÔ HÌNH

Bạn có thể huấn luyện trực tiếp trên Google Colab (GPU Miễn Phí) hoặc trên máy tính có GPU NVIDIA:

1. Cài đặt thư viện huấn luyện Piper:
```bash
pip install piper-train
```

2. Chạy huấn luyện từ checkpoint tiếng Việt gốc (`vi_VN-vivos`):
```bash
python -m piper_train \
    --dataset-dir dataset/domixi \
    --accelerator gpu \
    --devices 1 \
    --batch-size 16 \
    --max_epochs 500 \
    --checkpoint-epochs 25
```

---

## 📦 BƯỚC 3: XUẤT VÀ NẠP MÔ HÌNH VÀO APP

Khi quá trình huấn luyện hoàn tất và xuất ra tệp `domixi.onnx`:
Chỉ cần chạy lệnh nạp vào Tool:

```bash
python scripts/trainer/export_onnx.py --model "domixi.onnx" --name domixi
```

Tệp sẽ được nạp tự động vào `models/piper/domixi.onnx`.
Nhân `scripts/piper_tts_engine.py` của Tool Remotion5 sẽ **tự động phát hiện và kích hoạt giọng đọc mới 100% offline ngay lập tức**!
