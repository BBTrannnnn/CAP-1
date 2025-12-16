import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import zipfile
import os

print("TensorFlow version:", tf.__version__)
print("GPU Available:", tf.config.list_physical_devices('GPU'))

CONFIG = {
    'max_words': 10000,
    'max_len': 100,
    'embedding_dim': 256,
    'lstm_units': 128,
    'epochs': 50,
    'batch_size': 32,
    'validation_split': 0.15,
    'learning_rate': 0.002,
    'dropout_rate': 0.5,
    'recurrent_dropout': 0.3,
    'label_smoothing': 0.1,
    'focal_loss_gamma': 2.0,
}
CATEGORIES = ['stress', 'fear', 'anxiety', 'sadness', 'happy', 'neutral', 'confusion']
#TEXT PREPROCESSING - INTELLIGENT KEYWORD EMPHASIS
def preprocess_dream_text(text):
    """Enhanced preprocessing to emphasize emotional keywords"""
    import re
    text = text.lower().strip()
    emotion_keywords = {
        'stress': ['stress', 'áp lực', 'ap luc', 'căng thẳng', 'cang thang', 'deadline', 'overwhelm', 'quá tải', 'qua tai', 'kiệt sức', 'kiet suc', 'mệt mỏi', 'met moi', 'pressure', 'busy', 'tired', 'exhaust'],
        'fear': ['sợ', 'so', 'scared', 'afraid', 'fear', 'terrif', 'horror', 'nightmare', 'ác mộng', 'ac mong', 'ma', 'ghost', 'quỷ', 'quy', 'quái vật', 'quai vat', 'monster', 'demon', 'chase', 'chạy trốn', 'chay tron', 'bị đuổi', 'bi duoi'],
        'anxiety': ['lo lắng', 'lo lang', 'lo âu', 'lo au', 'anxious', 'anxiety', 'worry', 'nervous', 'restless', 'bối rối', 'boi roi', 'thi', 'exam', 'test', 'kiểm tra', 'kiem tra', 'quên', 'quen', 'forget', 'mất', 'mat', 'lost', 'uncertain'],
        'sadness': ['buồn', 'buon', 'sad', 'depressed', 'unhappy', 'sorrow', 'grief', 'khóc', 'khoc', 'cry', 'tears', 'nước mắt', 'nuoc mat', 'cô đơn', 'co don', 'lonely', 'alone', 'chết', 'chet', 'death', 'died', 'funeral'],
        'happy': ['vui', 'happy', 'joy', 'delight', 'cười', 'cuoi', 'laugh', 'smile', 'hạnh phúc', 'hanh phuc', 'wonderful', 'amazing', 'great', 'yêu', 'yeu', 'love'],
        'confusion': ['lạ', 'la', 'weird', 'strange', 'bizarre', 'không hiểu', 'khong hieu', 'confused', 'kỳ lạ', 'ky la', 'unusual', 'peculiar', 'mysterious', 'mơ hồ', 'mo ho', 'unclear']
    }
    for category, keywords in emotion_keywords.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text):
                text = re.sub(pattern, f'{keyword} {keyword}', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text