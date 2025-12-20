# ==========================================
#   SERVER AI: VINALLAMA (SINGLE PARAGRAPH FIX)
# ==========================================
import os
import sys

# 1. CÀI ĐẶT
print("Đang kiểm tra thư viện...")
os.system("pip install -q -U bitsandbytes transformers peft accelerate datasets fastapi uvicorn pyngrok nest_asyncio")

# 2. CẤU HÌNH
NGROK_TOKEN = "376fTqd7ZLEBXEn7j65Uft95mxB_6mo8Hq5kpxr1PDyP21ZmU" 
PORT = 8000

# 3. TẠO SERVER FILE
server_content = f"""
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
from pyngrok import ngrok, conf
import nest_asyncio
import re

conf.get_default().auth_token = "{NGROK_TOKEN}"
nest_asyncio.apply()

app = FastAPI()

print("Đang tải Model Vinallama...")

base_model_id = "vilm/vinallama-7b-chat"
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=False,
)

# Load Tokenizer & Model
try:
    tokenizer = AutoTokenizer.from_pretrained(base_model_id)
    tokenizer.pad_token = tokenizer.eos_token
    
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        quantization_config=bnb_config,
        device_map="auto"
    )
except Exception as e:
    print(f"Lỗi tải Base Model: {{e}}")
    exit()

# Load Adapter
adapter_path = ""
import os
for root, dirs, files in os.walk("/kaggle/input"):
    if "adapter_model.safetensors" in files:
        adapter_path = root
        print(f"Đã tìm thấy Adapter: {{adapter_path}}")
        break

try:
    if adapter_path:
        model = PeftModel.from_pretrained(base_model, adapter_path)
        print("ĐÃ NẠP FINE-TUNED MODEL THÀNH CÔNG!")
    else:
        model = base_model
        print("Không tìm thấy Adapter, chạy Base Model.")
except:
    model = base_model

model.eval()

class DreamRequest(BaseModel):
    dream: str

@app.post("/analyze")
async def analyze(req: DreamRequest):
    try:
        # Prompt ép trả lời ngắn, tập trung
        prompt = f'''<|im_start|>system
Bạn là chuyên gia giải mã giấc mơ. Hãy giải thích ý nghĩa giấc mơ sau đây một cách ngắn gọn, đi thẳng vào vấn đề. Không liệt kê thêm các ví dụ khác.
<|im_end|>
<|im_start|>user
{{req.dream}}
<|im_end|>
<|im_start|>assistant
'''
        
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=250,      # Giới hạn độ dài ngắn thôi
                do_sample=True,
                temperature=0.3,         # Giảm nhiệt độ để bớt "phiêu"
                top_p=0.9,
                repetition_penalty=1.2,
                pad_token_id=tokenizer.eos_token_id
            )
        
        input_length = inputs['input_ids'].shape[1]
        generated_tokens = outputs[0][input_length:]
        result = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        # === BỘ LỌC CẮT CỤT (QUAN TRỌNG) ===
        
        # 1. Cắt ngay khi gặp dấu hiệu liệt kê "( 1 )" hoặc "1."
        result = re.split(r'\( \d+ \)', result)[0]  # Cắt khi gặp ( 1 )
        result = re.split(r'\\n\d+\.', result)[0]    # Cắt khi gặp 1.
        
        # 2. Cắt ngay khi gặp 2 lần xuống dòng liên tiếp (Hết đoạn văn là dừng)
        if "\\n\\n" in result:
            result = result.split("\\n\\n")[0]
            
        # 3. Cắt các từ khóa kết thúc hệ thống
        stop_words = ["<|im_end|>", "User:", "(Lưu ý", "Dream:"]
        for word in stop_words:
            if word in result:
                result = result.split(word)[0]

        return {{"result": result.strip()}}

    except Exception as e:
        print(f"Lỗi: {{e}}")
        return {{"result": "Hệ thống đang bận."}}

if __name__ == "__main__":
    try:
        ngrok.kill()
        public_url = ngrok.connect({PORT}).public_url
        print("="*50)
        print(f"SERVER FIX ĐANG CHẠY: {{public_url}}/analyze")
        print("="*50)
        uvicorn.run(app, host="0.0.0.0", port={PORT})
    except Exception as e:
        print("Lỗi khởi động:", e)
"""

with open("server.py", "w", encoding="utf-8") as f:
    f.write(server_content)

print("Đang khởi động Server...")
#!python server.py