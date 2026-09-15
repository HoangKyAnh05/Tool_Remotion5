import os
import zipfile
import json
import numpy as np

voicepack_path = 'models/kokoro/voicepacks/ngoc_huyen.pt'
print("Checking voicepack:", voicepack_path, os.path.exists(voicepack_path))

try:
    import torch
    data = torch.load(voicepack_path, map_location='cpu', weights_only=True)
    print("Torch loaded successfully! Type:", type(data), "Shape:", getattr(data, 'shape', None))
except Exception as e:
    print("Torch load err:", e)
    # Check if zipfile
    if zipfile.is_zipfile(voicepack_path):
        with zipfile.ZipFile(voicepack_path) as z:
            print("Zip contents:", z.namelist())
