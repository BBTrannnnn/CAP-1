import os
import time

# ==============================================================================
# 0. CÀI ĐẶT MÔI TRƯỜNG (CHẠY 1 LẦN)
# ==============================================================================
print("⏳ Đang thiết lập môi trường sạch...")

# Cài đặt bộ tứ quyền lực cho Fine-tuning 4-bit
# -U: Upgrade lên bản mới nhất ổn định
# bitsandbytes: Quản lý bộ nhớ GPU
# peft: Kỹ thuật LoRA
# accelerate: Tăng tốc training
# transformers: Thư viện lõi
os.system("pip install -q -U bitsandbytes peft accelerate datasets trl")
os.system("pip install -q -U transformers") 

print("✅ Đã cài xong thư viện! Đang khởi động Training...")

# ==============================================================================
# 1. IMPORT & CẤU HÌNH
# ==============================================================================
import torch
import pandas as pd
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Model Vinallama (Bản 7B Chat)
MODEL_NAME = "vilm/vinallama-7b-chat"
NEW_MODEL_NAME = "vinallama-dream-interpreter"

# 👇 Đường dẫn file dữ liệu của bạn (Kiểm tra kỹ tên folder)
DATA_PATH = "/kaggle/input/dreamed/dream_data_vietnamese_v2.csv"

# ==============================================================================
# 2. XỬ LÝ DỮ LIỆU
# ==============================================================================
print(f"📖 Đang đọc dữ liệu từ: {DATA_PATH}")

try:
    df = pd.read_csv(DATA_PATH)
    # Chuẩn hóa tên cột (về chữ thường, xóa khoảng trắng)
    df.columns = [c.lower().strip() for c in df.columns]
    
    # Map tên cột nếu nó không đúng chuẩn
    column_mapping = {
        'content': 'dream', 'giấc mơ': 'dream',
        'meaning': 'output', 'giải mã': 'output', 'ý nghĩa': 'output'
    }
    df.rename(columns=column_mapping, inplace=True)
    
    # Kiểm tra lần cuối
    if 'dream' not in df.columns or 'output' not in df.columns:
        raise ValueError(f"File thiếu cột 'dream' hoặc 'output'. Các cột hiện có: {list(df.columns)}")
    
    dataset = Dataset.from_pandas(df[['dream', 'output']])
    print(f"✅ Dữ liệu OK: {len(dataset)} dòng.")

except Exception as e:
    print(f"❌ Lỗi dữ liệu: {e}")
    exit()

# ==============================================================================
# 3. TẢI MODEL & TOKENIZER
# ==============================================================================
print("⏳ Đang tải Vinallama (Sẽ mất khoảng 2-3 phút)...")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # Cấu hình 4-bit (Tiết kiệm VRAM)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=False,
    )

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )
    
    # Chuẩn bị model (Tắt cache để tiết kiệm RAM khi train)
    model.config.use_cache = False 
    model.config.pretraining_tp = 1
    model = prepare_model_for_kbit_training(model)
    
except Exception as e:
    print(f"❌ Lỗi tải Model: {e}")
    exit()

# ==============================================================================
# 4. GẮN LORA ADAPTER
# ==============================================================================
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
)

model = get_peft_model(model, peft_config)
model.print_trainable_parameters()

# ==============================================================================
# 5. FORMAT DỮ LIỆU (CHATML CHO VINALLAMA)
# ==============================================================================
def format_chatml(example):
    # Prompt ép khuôn chuyên gia
    text = f"""<|im_start|>system
Bạn là một chuyên gia tâm lý và phong thủy uy tín. Hãy giải mã giấc mơ sau đây một cách chi tiết, nhân văn và đưa ra lời khuyên hữu ích.
<|im_end|>
<|im_start|>user
{example['dream']}
<|im_end|>
<|im_start|>assistant
{example['output']}
<|im_end|>"""
    
    # Tokenize
    tokenized = tokenizer(
        text,
        truncation=True,
        max_length=512,
        padding="max_length"
    )
    tokenized["labels"] = tokenized["input_ids"].copy()
    return tokenized

print("🛠 Đang xử lý dữ liệu...")
tokenized_dataset = dataset.map(format_chatml, remove_columns=dataset.column_names)

# ==============================================================================
# 6. BẮT ĐẦU TRAIN
# ==============================================================================
training_args = TrainingArguments(
    output_dir="./results_vinallama",
    num_train_epochs=1,              # 1 Epoch là đủ với 1000 dòng
    per_device_train_batch_size=4,
    gradient_accumulation_steps=2,
    optim="paged_adamw_32bit",
    save_steps=50,
    logging_steps=10,
    learning_rate=2e-4,
    weight_decay=0.001,
    fp16=True,
    max_grad_norm=0.3,
    warmup_ratio=0.03,
    group_by_length=True,
    lr_scheduler_type="cosine",
    report_to="none"
)

trainer = Trainer(
    model=model,
    train_dataset=tokenized_dataset,
    args=training_args,
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

print("🚀 START TRAINING...")
trainer.train()

# ==============================================================================
# 7. LƯU THÀNH QUẢ
# ==============================================================================
save_path = f"/kaggle/working/{NEW_MODEL_NAME}"
print(f"💾 Đang lưu model tại: {save_path}")

trainer.model.save_pretrained(save_path)
tokenizer.save_pretrained(save_path)

print("✅ TRAINING THÀNH CÔNG! Hãy tải folder về.")