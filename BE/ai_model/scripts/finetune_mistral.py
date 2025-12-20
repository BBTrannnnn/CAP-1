import os
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

#CẤU HÌNH VÀ TẢI DỮ LIỆU
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"
NEW_MODEL_NAME = "mistral-dream-interpreter"

DATA_PATH = "/kaggle/input/deamclean/dreams_clean.csv" 

#Kiểm tra xem file có tồn tại không
print(f"Đang đọc dữ liệu từ: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)

#Chuyển đổi dữ liệu sang định dạng Dataset của HuggingFace
dataset = Dataset.from_pandas(df[['dream', 'output']])

#TẢI TOKENIZER VÀ MODEL (QLoRA 4-bit)
print("Đang tải Tokenizer và Model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
#Cài đặt padding token (Mistral mặc định không có)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right" #tránh lỗi khi train fp16

#Cấu hình lượng tử hóa 4-bit để chạy được trên GPU T4 của Kaggle
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

#Chuẩn bị model để training 4-bit
model.config.use_cache = False 
model.config.pretraining_tp = 1
model = prepare_model_for_kbit_training(model)

#CẤU HÌNH LORA (FINE-TUNING EFFICIENT) ---
peft_config = LoraConfig(
    r=16,                    # Tăng rank lên 16 để model học tốt hơn (mặc định 8)
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    # Target vào tất cả các module linear để kết quả tốt nhất
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
)

model = get_peft_model(model, peft_config)
model.print_trainable_parameters() # In ra số lượng tham số sẽ train

#XỬ LÝ DỮ LIỆU (PROMPT TEMPLATE) 
#Format chuẩn cho Mistral Instruct: <s>[INST] Instruction [/INST] Model answer</s>
def preprocess(example):
    # Tạo prompt hướng dẫn
    prompt = f"<s>[INST] Bạn là chuyên gia giải mã giấc mơ. Hãy phân tích giấc mơ sau và đưa ra lời khuyên: {example['dream']} [/INST] {example['output']} </s>"
    
    # Tokenize
    tokenized = tokenizer(
        prompt,
        truncation=True,
        max_length=512, # Độ dài tối đa context
        padding="max_length"
    )
    
    # Với Causal LM, labels chính là input_ids
    tokenized["labels"] = tokenized["input_ids"].copy()
    return tokenized

print("🛠 Đang xử lý dữ liệu...")
tokenized_dataset = dataset.map(preprocess, remove_columns=dataset.column_names)

#THIẾT LẬP TRAINING
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=5,              # Số vòng lặp train (tăng lên 3-5 nếu muốn kết quả tốt hơn)
    per_device_train_batch_size=4,   # Tăng lên nếu GPU còn trống RAM
    gradient_accumulation_steps=1,
    optim="paged_adamw_32bit",       # Optimizer tối ưu bộ nhớ
    save_steps=50,
    logging_steps=10,
    learning_rate=2e-4,
    weight_decay=0.001,
    fp16=True,                       # Sử dụng mixed precision
    max_grad_norm=0.3,
    warmup_ratio=0.03,
    group_by_length=True,
    lr_scheduler_type="constant",
    report_to="none"                 # Tắt report wandb cho đơn giản
)

trainer = Trainer(
    model=model,
    train_dataset=tokenized_dataset,
    args=training_args,
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

#BẮT ĐẦU TRAIN
print("Bắt đầu quá trình Fine-tuning...")
trainer.train()

#LƯU MODEL
save_path = f"/kaggle/working/{NEW_MODEL_NAME}"
print(f"Đang lưu model tại: {save_path}")

trainer.model.save_pretrained(save_path)
tokenizer.save_pretrained(save_path)

print("Model đã được lưu")