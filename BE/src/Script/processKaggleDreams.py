import pandas as pd
import json
import re

#Doc file CSV
print("doc dreams.csv")
df = pd.read_csv('kaggle_data/dreams.csv')
print(f"Tong so dreams: {len(df)}")

#Keywords cho tung category - map sang categories cua model
categories = {
    'happy': ['happy', 'joy', 'excited', 'wonderful', 'celebration', 'laugh', 'smile', 'fun', 'pleasure', 'delight', 'cheerful', 'playful'],
    'sadness': ['sad', 'cry', 'depressed', 'lonely', 'miss', 'grief', 'sorrow', 'miserable', 'unhappy', 'melancholy', 'tears'],
    'fear': ['scared', 'afraid', 'terrified', 'panic', 'danger', 'threat', 'fear', 'frighten', 'alarm', 'horror', 'dread'],
    'neutral': ['normal', 'daily', 'routine', 'usual', 'ordinary', 'regular', 'common', 'typical', 'everyday', 'mundane'],
    'anxiety': ['nervous', 'anxious', 'worried', 'tense', 'restless', 'uneasy', 'concern', 'anticipation'],
    'stress': ['nightmare', 'death', 'killed', 'murder', 'attack', 'chased', 'trapped', 'monster', 'blood', 'scream', 'escape'],
    'confusion': ['weird', 'strange', 'surreal', 'bizarre', 'unusual', 'odd', 'peculiar', 'mysterious', 'supernatural', 'alien']
}

# Ham phan loai dream
def classify_dream(text):
    if pd.isna(text):
        return None
    
    text_lower = text.lower()
    scores = {}
    
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[category] = score
    
    max_score = max(scores.values())
    if max_score == 0:
        return 'neutral'
    
    return max(scores, key=scores.get)

# Phan loai tat ca dreams
print("Dang phan loai dreams...")
df['category'] = df['dreams_text'].apply(classify_dream)

# Loc dreams hop le
df = df.dropna(subset=['dreams_text', 'category'])
df = df[df['dreams_text'].str.len() > 20]
df = df[df['dreams_text'].str.len() < 500]

print(f"So dreams hop le: {len(df)}")

# Thong ke theo category
print("\nPhan bo theo category:")
for cat in categories.keys():
    count = len(df[df['category'] == cat])
    print(f"  {cat}: {count} dreams")

print("\nDang chuan bi luu tat ca dreams tu Kaggle...")
kaggle_dreams = []
for _, dream in df.iterrows():
    kaggle_dreams.append({
        'text': dream['dreams_text'],
        'category': dream['category']
    })

# Thong ke final
print("\nPhan bo final:")
category_counts = {}
for dream in kaggle_dreams:
    cat = dream['category']
    category_counts[cat] = category_counts.get(cat, 0) + 1

for cat, count in sorted(category_counts.items()):
    print(f"  {cat}: {count} dreams")

# Luu file moi
output_file = 'dream_training_data_kaggle.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(kaggle_dreams, f, ensure_ascii=False, indent=2)

print(f"\nDa luu file: {output_file}")
print("Hoan thanh!")
