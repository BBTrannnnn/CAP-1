import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from tqdm import tqdm

# 1. Cấu hình
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"
INPUT_FILE = "/kaggle/input/deamclean/dreams_clean.csv" # Đảm bảo file này đã upload lên Kaggle
OUTPUT_FILE = "dataset_train_chuan.csv"
SAMPLES = 24000  # Lấy 24000 mẫu để train (chạy mất khoảng 30-40 phút trên T4)

# 2. Đọc file gốc
print("Đang đọc dữ liệu gốc...")
try:
    df = pd.read_csv(INPUT_FILE)
except:
    # Nếu chạy trên Kaggle mà chưa add data, dòng này fix đường dẫn
    df = pd.read_csv("/kaggle/input/deamclean/dreams_clean.csv")

# Lấy ngẫu nhiên mẫu
df_sample = df.sample(SAMPLES, random_state=42).copy()

# 3. Tải Model "Thầy giáo"
print("Đang tải Model Mistral để sinh dữ liệu...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=False,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto"
)

# 4. Hàm sinh lời giải tiếng Việt
def create_interpretation(dream_text):
    # Prompt ép AI: Đọc tiếng Anh -> Trả lời tiếng Việt chuyên sâu
    prompt = f"""<s>[INST] You are a dream interpretation expert (Psychology & Spirituality).
    Task: Analyze the following dream.
    Dream Content: "{dream_text}"
    
    Requirement: Provide the interpretation in VIETNAMESE language. Keep it insightful but concise. [/INST]"""
    
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=True,
            temperature=0.7,
            pad_token_id=tokenizer.eos_token_id
        )
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Lấy phần sau thẻ [/INST]
    if "[/INST]" in result:
        return result.split("[/INST]")[1].strip()
    return result

# 5. Chạy vòng lặp
print(f"Bắt đầu tạo lời giải cho {SAMPLES} giấc mơ...")
tqdm.pandas()
df_sample['output'] = df_sample['dream'].progress_apply(create_interpretation)

# 6. Lưu file mới
df_sample.to_csv(OUTPUT_FILE, index=False)
print(f"có file '{OUTPUT_FILE}' chứa Input và Output.")