#!pip install deep-translator
import json
from deep_translator import GoogleTranslator

import json

# Đọc file JSON đã phân loại
with open('dream_training_data_kaggle.json', 'r', encoding='utf-8') as f:
    dreams = json.load(f)

translated_dreams = []
for i, dream in enumerate(dreams):
    en_text = dream['text']
    category = dream['category']
    try:
        vi_text = GoogleTranslator(source='en', target='vi').translate(en_text)
    except Exception as e:
        print(f"Lỗi dịch dòng {i}: {e}")
        vi_text = en_text
    translated_dreams.append({
        'text': vi_text,
        'category': category
    })
    if i % 100 == 0:
        print(f"Đã dịch xong {i} dòng...")

with open('dream_training_data_vi_from_csv.json', 'w', encoding='utf-8') as f:
    json.dump(translated_dreams, f, ensure_ascii=False, indent=2)

print("Đã tạo xong dữ liệu tiếng Việt từ JSON đã phân loại!")
