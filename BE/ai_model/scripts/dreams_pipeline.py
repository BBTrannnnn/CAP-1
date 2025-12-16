# Đọc dữ liệu từ Hugging Face datasets
def read_data_hf(dataset_name="gustavecortal/DreamBank-annotated", split="train"):
    from datasets import load_dataset
    dataset = load_dataset(dataset_name, split=split)
    if 'report' in dataset.column_names:
        texts = [item['report'] for item in dataset if item.get('report')]
    elif 'text' in dataset.column_names:
        texts = [item['text'] for item in dataset if item.get('text')]
    else:
        col = dataset.column_names[0]
        texts = [item[col] for item in dataset if item.get(col)]
    return texts
# Phân loại category truyền thống bằng từ khóa
categories = {
    'happy': ['happy', 'joy', 'excited', 'wonderful', 'celebration', 'laugh', 'smile', 'fun', 'pleasure', 'delight', 'cheerful', 'playful'],
    'sadness': ['sad', 'cry', 'depressed', 'lonely', 'miss', 'grief', 'sorrow', 'miserable', 'unhappy', 'melancholy', 'tears'],
    'fear': ['scared', 'afraid', 'terrified', 'panic', 'danger', 'threat', 'fear', 'frighten', 'alarm', 'horror', 'dread'],
    'neutral': ['normal', 'daily', 'routine', 'usual', 'ordinary', 'regular', 'common', 'typical', 'everyday', 'mundane'],
    'anxiety': ['nervous', 'anxious', 'worried', 'tense', 'restless', 'uneasy', 'concern', 'anticipation'],
    'stress': ['nightmare', 'death', 'killed', 'murder', 'attack', 'chased', 'trapped', 'monster', 'blood', 'scream', 'escape'],
    'confusion': ['weird', 'strange', 'surreal', 'bizarre', 'unusual', 'odd', 'peculiar', 'mysterious', 'supernatural', 'alien']
}

def classify_dream(text):
    text_lower = text.lower()
    scores = {}
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[category] = score
    max_score = max(scores.values())
    if max_score == 0:
        return 'neutral'
    return max(scores, key=scores.get)

import pandas as pd
import json
import re
from textblob import TextBlob
import spacy
from gensim import corpora, models

try:
    nlp = spacy.load("en_core_web_sm")
except:
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def read_data(file_path):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
        if 'dreams_text' in df.columns:
            texts = df['dreams_text'].dropna().tolist()
        elif 'text' in df.columns:
            texts = df['text'].dropna().tolist()
        else:
            texts = df.iloc[:,0].dropna().tolist()
    elif file_path.endswith('.json'):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        texts = [item.get('text', '') for item in data if item.get('text', '')]
    else:
        raise ValueError('Unsupported file format')
    return texts

def preprocess(text):
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    text = text.lower()
    return text

def get_sentiment(text):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    if polarity > 0.1:
        return 'positive'
    elif polarity < -0.1:
        return 'negative'
    else:
        return 'neutral'

def get_entities(text):
    doc = nlp(text)
    return [ent.text for ent in doc.ents]

def get_topics(texts, num_topics=5):
    processed = [[word for word in preprocess(text).split() if len(word) > 2] for text in texts]
    dictionary = corpora.Dictionary(processed)
    corpus = [dictionary.doc2bow(text) for text in processed]
    lda = models.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=10)
    topics = []
    for bow in corpus:
        topic = lda.get_document_topics(bow)
        if topic:
            topic_id = max(topic, key=lambda x: x[1])[0]
            topic_words = lda.show_topic(topic_id, topn=3)
            topics.append(' '.join([w for w, _ in topic_words]))
        else:
            topics.append('unknown')
    return topics

def process_dreams(file_path, output_file):
    if file_path.startswith('hf://') or file_path == 'huggingface':
        print("Đọc dữ liệu từ Hugging Face datasets...")
        texts = read_data_hf()
    else:
        print(f"Đọc dữ liệu từ {file_path}")
        texts = read_data(file_path)
    print(f"Tổng số dreams: {len(texts)}")
    texts = [t for t in texts if 20 < len(t) < 500]
    print(f"Số dreams hợp lệ: {len(texts)}")

    print("Phân loại category...")
    categories_list = [classify_dream(t) for t in texts]
    print("Phân tích cảm xúc...")
    sentiments = [get_sentiment(t) for t in texts]
    print("Nhận diện thực thể...")
    entities_list = [get_entities(t) for t in texts]
    print("Phân nhóm chủ đề...")
    topics = get_topics(texts)

    dreams = []
    for i, text in enumerate(texts):
        dreams.append({
            'text': text,
            'category': categories_list[i],
            'sentiment': sentiments[i],
            'entities': entities_list[i],
            'topic': topics[i]
        })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dreams, f, ensure_ascii=False, indent=2)
    print(f"Đã lưu file: {output_file}")
    print("Hoàn thành!")

if __name__ == "__main__":
    input_file_kaggle = r'C:/Users/User/OneDrive/Desktop/WORKSPACE/Capstone1/CAP-1/BE/dataset/dreams.csv'
    output_file_kaggle = 'dream_training_data_kaggle.json'
    process_dreams(input_file_kaggle, output_file_kaggle)

    input_file_hf = 'huggingface'
    output_file_hf = 'dream_training_data_hf.json'
    process_dreams(input_file_hf, output_file_hf)