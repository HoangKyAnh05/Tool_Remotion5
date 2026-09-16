import os
import sys
import argparse
import shutil

def export_model_to_piper(checkpoint_path, config_path, voice_name):
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    models_dir = os.path.join(root_dir, 'models', 'piper')
    os.makedirs(models_dir, exist_ok=True)
    
    dest_onnx = os.path.join(models_dir, f"{voice_name}.onnx")
    dest_json = os.path.join(models_dir, f"{voice_name}.onnx.json")
    
    if os.path.exists(checkpoint_path):
        shutil.copy(checkpoint_path, dest_onnx)
        print(f"[Export] Copied ONNX model to: {dest_onnx}")
    else:
        print(f"[Export Error] Checkpoint '{checkpoint_path}' not found!")
        return False
        
    if os.path.exists(config_path):
        shutil.copy(config_path, dest_json)
        print(f"[Export] Copied ONNX config to: {dest_json}")
    else:
        # Fallback to global config if available
        global_config = os.path.join(models_dir, 'config.json')
        if os.path.exists(global_config):
            shutil.copy(global_config, dest_json)
            print(f"[Export] Created config from global config: {dest_json}")
            
    print(f"\n✨ THÀNH CÔNG! Giọng '{voice_name}' đã được nạp vào thư mục models/piper/!")
    print(f"Bây giờ bạn có thể chọn giọng '{voice_name}' trực tiếp trong Tool Remotion5!")
    return True

def main():
    parser = argparse.ArgumentParser(description="Xuất và nạp mô hình VITS .onnx vào Tool Remotion5")
    parser.add_argument("--model", required=True, help="Đường dẫn file .onnx đã train xong")
    parser.add_argument("--config", help="Đường dẫn file .json config tương ứng")
    parser.add_argument("--name", required=True, help="Tên giọng đọc (ví dụ: domixi, pewpew, duynen, sharkhung)")
    
    args = parser.parse_args()
    export_model_to_piper(args.model, args.config or "", args.name)

if __name__ == "__main__":
    main()
