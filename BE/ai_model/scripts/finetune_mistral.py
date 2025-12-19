import pandas as pd
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

# 1. Load data
df = pd.read_csv('dreams_clean.csv')
# Check if 'output' column exists; if not, create a placeholder for training/annotation
if 'output' not in df.columns:
    print("[WARNING] 'output' column not found. Creating empty 'output' column for annotation or inference mode.")
    df['output'] = ""
df = df.dropna(subset=['dream'])
dataset = Dataset.from_pandas(df[['dream', 'output']])

# 2. Tokenizer & Model
model_name = "mistralai/Mistral-7B-Instruct-v0.2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
# Ensure pad_token exists for padding
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    load_in_4bit=True,
    device_map="auto"
)
model = prepare_model_for_kbit_training(model)

# 3. PEFT/QLoRA config
peft_config = LoraConfig(
    r=8, lora_alpha=16, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM"
)
model = get_peft_model(model, peft_config)

# 4. Preprocess
def preprocess(example):
    prompt = f"Giấc mơ: {example['dream']}\nPhân tích & lời khuyên:"
    target = example['output']
    text = prompt + " " + target if target else prompt
    tokenized = tokenizer(text, truncation=True, max_length=512, padding="max_length")
    tokenized["labels"] = tokenized["input_ids"].copy()
    return tokenized

tokenized = dataset.map(preprocess)

# 5. Training args
training_args = TrainingArguments(
    per_device_train_batch_size=2,
    num_train_epochs=3,
    learning_rate=2e-4,
    fp16=True,
    output_dir="./mistral-dreams-finetuned",
    save_total_limit=2,
    logging_steps=10,
    save_steps=100,
    report_to="none"
)

# 6. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized,
    tokenizer=tokenizer
)

trainer.train()
model.save_pretrained("./mistral-dreams-finetuned")
tokenizer.save_pretrained("./mistral-dreams-finetuned")
