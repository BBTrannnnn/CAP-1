"""
DREAM ANALYSIS MODEL TRAINING - GOOGLE COLAB VERSION
Train LSTM model với GPU/TPU - Nhanh gấp 10-20 lần so với CPU

HƯỚNG DẪN SỬ DỤNG:
1. Mở Google Colab: https://colab.research.google.com/
2. Runtime > Change runtime type > Hardware accelerator > GPU (Tesla T4)
3. Upload file dream_training_data.json
4. Copy paste code này vào Colab
5. Run all cells
6. Download trained model về máy

Thời gian dự kiến: 1-2 phút với GPU (thay vì 3 tiếng với CPU!)
"""

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

# ============ CONFIG ============
CONFIG = {
    'max_words': 2000,      # Tang 1000 -> 2000 (quan trong!)
    'max_len': 50,
    'embedding_dim': 128,   # Tang 64 -> 128
    'lstm_units': 64,       # Giam 128 -> 64 (tranh overfit)
    'epochs': 50,           # Tang 30 -> 50
    'batch_size': 16,       # Giam 32 -> 16 (update nhieu hon)
    'validation_split': 0.2,
    'learning_rate': 0.003, # Tang 0.001 -> 0.003 (quan trong!)
}

CATEGORIES = ['stress', 'fear', 'anxiety', 'sadness', 'happy', 'neutral', 'confusion']

print("\nCONFIG:")
print(f"   Epochs: {CONFIG['epochs']}")
print(f"   Batch size: {CONFIG['batch_size']}")
print(f"   LSTM units: {CONFIG['lstm_units']}")
print(f"   Max sequence length: {CONFIG['max_len']}")


# ============ LOAD DATA ============
def load_data(file_path='dream_training_data.json'):
    """Load and prepare training data"""
    print(f"\nLoading data from {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    texts = [d['text'].lower() for d in data]
    labels = [CATEGORIES.index(d['category']) for d in data]
    
    print(f"Loaded {len(texts)} dreams")
    
    # Category distribution
    category_counts = {}
    for label in labels:
        cat = CATEGORIES[label]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print("\nCategory distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        pct = (count / len(labels)) * 100
        print(f"   {cat:10s} {count:4d} ({pct:.1f}%)")
    
    # DEBUG: Check sample data
    print("\nSample dreams:")
    for i in range(min(3, len(texts))):
        print(f"   [{CATEGORIES[labels[i]]}] {texts[i][:80]}...")
    
    return texts, labels


# ============ TOKENIZATION ============
def create_tokenizer(texts, max_words):
    """Create and fit tokenizer"""
    print(f"\nBuilding vocabulary (max {max_words} words)...")
    
    tokenizer = keras.preprocessing.text.Tokenizer(
        num_words=max_words,
        oov_token='<OOV>',
        filters='!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n'
    )
    tokenizer.fit_on_texts(texts)
    
    vocab_size = min(len(tokenizer.word_index) + 1, max_words)
    print(f"Vocabulary size: {vocab_size} words")
    
    return tokenizer, vocab_size


def prepare_sequences(texts, tokenizer, max_len):
    """Convert texts to padded sequences"""
    print(f"\nConverting texts to sequences (max length {max_len})...")
    
    sequences = tokenizer.texts_to_sequences(texts)
    padded = keras.preprocessing.sequence.pad_sequences(
        sequences,
        maxlen=max_len,
        padding='post',
        truncating='post'
    )
    
    print(f"Prepared {len(padded)} sequences")
    return padded


# ============ BUILD MODEL ============
def build_model(vocab_size, config):
    """Build LSTM model"""
    print("\nBuilding LSTM model...")
    
    model = keras.Sequential([
        layers.Embedding(
            input_dim=vocab_size,
            output_dim=config['embedding_dim'],
            input_length=config['max_len'],
            name='embedding'
        ),
        layers.LSTM(
            config['lstm_units'],
            return_sequences=False,
            name='lstm'
        ),
        layers.Dense(64, activation='relu', name='dense_1'),
        layers.Dropout(0.5, name='dropout'),
        layers.Dense(len(CATEGORIES), activation='softmax', name='output')
    ])
    
    # Build model first (fix the count_params error)
    model.build(input_shape=(None, config['max_len']))
    
    # Compile with optimizer
    optimizer = keras.optimizers.Adam(learning_rate=config['learning_rate'])
    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\nModel Architecture:")
    model.summary()
    
    total_params = model.count_params()
    print(f"\nTotal parameters: {total_params:,}")
    
    return model


# ============ TRAIN MODEL ============
def train_model(model, X_train, y_train, config):
    """Train the model"""
    print("\nStarting training...")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation split: {config['validation_split']*100:.0f}%")
    print(f"   Epochs: {config['epochs']}")
    print(f"   Batch size: {config['batch_size']}")
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            verbose=1,
            min_lr=0.00001
        )
    ]
    
    # Train
    history = model.fit(
        X_train, y_train,
        epochs=config['epochs'],
        batch_size=config['batch_size'],
        validation_split=config['validation_split'],
        callbacks=callbacks,
        verbose=1
    )
    
    # Final metrics
    final_train_acc = history.history['accuracy'][-1]
    final_val_acc = history.history['val_accuracy'][-1]
    
    print("\nTraining completed!")
    print(f"   Final Training Accuracy: {final_train_acc*100:.2f}%")
    print(f"   Final Validation Accuracy: {final_val_acc*100:.2f}%")
    
    return history


# ============ SAVE MODEL ============
def save_model_for_tfjs(model, tokenizer, save_dir='trained_model'):
    """Save model in TensorFlow.js format"""
    print(f"\nSaving model to {save_dir}...")
    
    # Create directory
    os.makedirs(save_dir, exist_ok=True)
    
    # Save model in TF.js format
    import tensorflowjs as tfjs
    tfjs.converters.save_keras_model(model, save_dir)
    
    # Save tokenizer
    tokenizer_config = {
        'word_index': tokenizer.word_index,
        'index_word': {int(k): v for k, v in tokenizer.index_word.items()},
        'max_words': CONFIG['max_words'],
        'max_len': CONFIG['max_len'],
    }
    
    with open(f'{save_dir}/tokenizer.json', 'w', encoding='utf-8') as f:
        json.dump(tokenizer_config, f, ensure_ascii=False, indent=2)
    
    # Save config
    model_config = {
        'categories': CATEGORIES,
        'vocab_size': len(tokenizer.word_index) + 1,
        'max_len': CONFIG['max_len'],
        'embedding_dim': CONFIG['embedding_dim'],
        'lstm_units': CONFIG['lstm_units'],
    }
    
    with open(f'{save_dir}/config.json', 'w', encoding='utf-8') as f:
        json.dump(model_config, f, indent=2)
    
    print(f"Model saved successfully!")
    print(f"   Files: model.json, group1-shard*.bin, tokenizer.json, config.json")
    
    # Create zip for download
    zip_path = 'trained_model.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(save_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(save_dir))
                zipf.write(file_path, arcname)
    
    print(f"\nCreated ZIP file: {zip_path}")
    print("   Download this file and extract to BE/trained_model/")
    
    return save_dir


# ============ MAIN EXECUTION ============
def main():
    """Main training pipeline"""
    print("\n" + "="*60)
    print("DREAM ANALYSIS MODEL TRAINING")
    print("   Platform: Google Colab (GPU/TPU)")
    print("   Dataset: Self-generated + DreamBank")
    print("="*60)
    
    # Install tensorflowjs converter
    print("\nInstalling TensorFlow.js converter...")
    os.system('pip install -q tensorflowjs')
    
    # 1. Load data
    texts, labels = load_data('dream_training_data.json')
    
    # 2. Create tokenizer
    tokenizer, vocab_size = create_tokenizer(texts, CONFIG['max_words'])
    
    # 3. Prepare sequences
    X = prepare_sequences(texts, tokenizer, CONFIG['max_len'])
    y = np.array(labels)
    
    # 4. Build model
    model = build_model(vocab_size, CONFIG)
    
    # 5. Train model
    history = train_model(model, X, y, CONFIG)
    
    # 6. Save model
    save_dir = save_model_for_tfjs(model, tokenizer)
    
    print("\n" + "="*60)
    print("ALL DONE!")
    print("="*60)
    print("\nNEXT STEPS:")
    print("1. Download 'trained_model.zip' from Colab")
    print("2. Extract to: BE/trained_model/")
    print("3. Test API: POST /api/dreams/analyze")
    print("\nYour model is ready to use!")


# ============ RUN ============
if __name__ == '__main__':
    # Enable GPU memory growth
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"GPU configured: {len(gpus)} GPU(s) available")
        except RuntimeError as e:
            print(e)
    
    # Run training
    main()
