import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
import os

# --- CẤU HÌNH ---
# Đường dẫn đến thư mục chứa model bạn vừa train (giải nén file zip vào đây)
ADAPTER_MODEL_PATH = "./model_finetuned" 
BASE_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"

app = FastAPI()

print("-" * 50)
print(" ĐANG KHỞI ĐỘNG AI SERVER...")
print(f"   - Base Model: {BASE_MODEL_NAME}")
print(f"   - Adapter Path: {ADAPTER_MODEL_PATH}")
print("-" * 50)

# 1. Load Tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token
except Exception as e:
    print(f" Lỗi tải Tokenizer: {e}")
    exit(1)

# 2. Load Base Model (Dùng 4-bit để chạy nhẹ trên GPU thường)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=False,
)

try:
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto"
    )
except Exception as e:
    print(f" Lỗi tải Base Model: {e}")
    exit(1)

# 3. Load Model Fine-tuned (Adapter)
if os.path.exists(ADAPTER_MODEL_PATH):
    try:
        model = PeftModel.from_pretrained(base_model, ADAPTER_MODEL_PATH)
        model.eval() # Chế độ suy luận
        print(" ĐÃ LOAD MODEL THÀNH CÔNG! SẴN SÀNG PHỤC VỤ.")
    except Exception as e:
        print(f" Cảnh báo: Lỗi load Adapter ({e}). Hệ thống sẽ chạy bằng model gốc.")
        model = base_model
else:
    print(f" Không thấy thư mục '{ADAPTER_MODEL_PATH}'. Hệ thống sẽ chạy bằng model gốc.")
    model = base_model

# Định nghĩa format dữ liệu đầu vào
class DreamRequest(BaseModel):
    dream: str

@app.post("/analyze")
async def analyze_dream(req: DreamRequest):
    try:
        print(f"Nhận yêu cầu giải mã: {req.dream[:50]}...")
        
        # Format Prompt chuẩn (giống hệt lúc train)
        prompt = f"<s>[INST] Giải mã giấc mơ: {req.dream} [/INST]"
        
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=350,   # Độ dài tối đa câu trả lời
                do_sample=True,       # Cho phép sáng tạo
                temperature=0.7,      # Mức độ sáng tạo (0.7 là chuẩn)
                top_p=0.9,
                repetition_penalty=1.1, # Tránh lặp từ
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Giải mã kết quả từ số sang chữ
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Cắt bỏ phần prompt, chỉ lấy phần AI trả lời
        if "[/INST]" in full_response:
            result_text = full_response.split("[/INST]")[1].strip()
        else:
            result_text = full_response
            
        print("Đã giải mã xong.")
        return {"result": result_text}

    except Exception as e:
        print(f" Lỗi xử lý: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Chạy server tại cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)