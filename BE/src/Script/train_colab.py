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

#CONFIG - OPTIMIZED FOR INTELLIGENCE
CONFIG = {
    'max_words': 5000,           # Increased vocabulary size
    'max_len': 50,
    'embedding_dim': 256,        # Increased embedding dimension
    'lstm_units': 128,           # Increased LSTM units
    'epochs': 70,                # Increased epochs for better learning
    'batch_size': 32,            # Increased batch size
    'validation_split': 0.2,
    'learning_rate': 0.001,      # Decreased learning rate for stability
    'dropout_rate': 0.5,         # Dropout rate
    'recurrent_dropout': 0.3,    # Recurrent dropout for LSTM
    'label_smoothing': 0.1,      # Label smoothing to prevent overconfidence
    'focal_loss_gamma': 2.0,     # Focal loss gamma for hard examples
}

CATEGORIES = ['stress', 'fear', 'anxiety', 'sadness', 'happy', 'neutral', 'confusion']

print("\nCONFIG:")
print(f"Epochs: {CONFIG['epochs']}")
print(f"Batch size: {CONFIG['batch_size']}")
print(f"LSTM units: {CONFIG['lstm_units']}")
print(f"Max sequence length: {CONFIG['max_len']}")


#TEXT PREPROCESSING - INTELLIGENT KEYWORD EMPHASIS
def preprocess_dream_text(text):
    """Enhanced preprocessing to emphasize emotional keywords"""
    import re
    
    text = text.lower().strip()
    
    # Define strong emotional keywords (bilingual)
    emotion_keywords = {
        'stress': ['stress', 'áp lực', 'ap luc', 'căng thẳng', 'cang thang', 'deadline', 'overwhelm', 'quá tải', 'qua tai', 'kiệt sức', 'kiet suc', 'mệt mỏi', 'met moi', 'pressure', 'busy', 'tired', 'exhaust'],
        'fear': ['sợ', 'so', 'scared', 'afraid', 'fear', 'terrif', 'horror', 'nightmare', 'ác mộng', 'ac mong', 'ma', 'ghost', 'quỷ', 'quy', 'quái vật', 'quai vat', 'monster', 'demon', 'chase', 'chạy trốn', 'chay tron', 'bị đuổi', 'bi duoi'],
        'anxiety': ['lo lắng', 'lo lang', 'lo âu', 'lo au', 'anxious', 'anxiety', 'worry', 'nervous', 'restless', 'bối rối', 'boi roi', 'thi', 'exam', 'test', 'kiểm tra', 'kiem tra', 'quên', 'quen', 'forget', 'mất', 'mat', 'lost', 'uncertain'],
        'sadness': ['buồn', 'buon', 'sad', 'depressed', 'unhappy', 'sorrow', 'grief', 'khóc', 'khoc', 'cry', 'tears', 'nước mắt', 'nuoc mat', 'cô đơn', 'co don', 'lonely', 'alone', 'chết', 'chet', 'death', 'died', 'funeral'],
        'happy': ['vui', 'happy', 'joy', 'delight', 'cười', 'cuoi', 'laugh', 'smile', 'hạnh phúc', 'hanh phuc', 'wonderful', 'amazing', 'great', 'yêu', 'yeu', 'love'],
        'confusion': ['lạ', 'la', 'weird', 'strange', 'bizarre', 'không hiểu', 'khong hieu', 'confused', 'kỳ lạ', 'ky la', 'unusual', 'peculiar', 'mysterious', 'mơ hồ', 'mo ho', 'unclear']
    }
    
    # KEYWORD REPETITION: Repeat important emotional words 2x to emphasize
    # This helps model learn these keywords are VERY important
    for category, keywords in emotion_keywords.items():
        for keyword in keywords:
            # Use word boundary to match whole words only
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text):
                # Replace keyword with "keyword keyword" (2x repetition)
                text = re.sub(pattern, f'{keyword} {keyword}', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


#LOAD DATA - WITH INTELLIGENT PREPROCESSING
def load_data(file_path='dream_training_data.json'):
    print(f"\nLoading data from {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Apply intelligent preprocessing
    print("📝 Applying intelligent text preprocessing...")
    print("   - Emphasizing emotional keywords (2x repetition)")
    print("   - Normalizing text format")
    
    texts = [preprocess_dream_text(d['text']) for d in data]
    labels = [CATEGORIES.index(d['category']) for d in data]
    
    print(f"✅ Loaded {len(texts)} dreams")
    
    #Category distribution
    category_counts = {}
    for label in labels:
        cat = CATEGORIES[label]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print("\n📊 Category distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        pct = (count / len(labels)) * 100
        print(f"   {cat:10s} {count:5d} ({pct:>5.1f}%)")
    
    # Calculate imbalance ratio for awareness
    max_count = max(category_counts.values())
    min_count = min(category_counts.values())
    print(f"\n⚠️  Imbalance ratio: {max_count/min_count:.1f}x (will be handled by class weights)")
    
    #Check sample preprocessed data
    print("\n📄 Sample preprocessed dreams:")
    for i in range(min(3, len(texts))):
        original_len = len(data[i]['text'])
        processed_len = len(texts[i])
        print(f"   [{CATEGORIES[labels[i]]}] {texts[i][:100]}...")
        if processed_len > original_len:
            print(f"      (keywords emphasized: {original_len} → {processed_len} chars)")
    
    return texts, labels


#TOKENIZATION - PRESERVE EMOTIONAL KEYWORDS
def create_tokenizer(texts, max_words):
    print(f"\n📚 Building vocabulary (max {max_words} words)...")
    
    # Keep Vietnamese diacritics and important punctuation for emotion
    tokenizer = keras.preprocessing.text.Tokenizer(
        num_words=max_words,
        oov_token='<OOV>',
        filters='!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n',  # Remove punctuation but keep text
        lower=True,
        split=' ',
        char_level=False
    )
    
    tokenizer.fit_on_texts(texts)
    
    vocab_size = min(len(tokenizer.word_index) + 1, max_words)
    
    # Check if important emotional keywords are in vocabulary
    print(f"✅ Vocabulary size: {vocab_size} words")
    
    important_keywords = ['sợ', 'buồn', 'vui', 'stress', 'lo', 'lắng', 'scared', 'sad', 'happy', 'worry', 'fear', 'anxiety']
    found_keywords = [kw for kw in important_keywords if kw in tokenizer.word_index]
    print(f"   Emotional keywords in vocab: {len(found_keywords)}/{len(important_keywords)}")
    
    # Show top frequent words
    sorted_words = sorted(tokenizer.word_index.items(), key=lambda x: x[1])[:20]
    print(f"   Top 20 words: {', '.join([w for w, _ in sorted_words])}")
    
    return tokenizer, vocab_size
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


#BUILD MODEL - IMPROVED WITH BIDIRECTIONAL LSTM + ATTENTION
def build_model(vocab_size, config):
    print("\nBuilding improved LSTM model with Bidirectional layers + Attention...")
    
    # Input layer
    input_layer = layers.Input(shape=(config['max_len'],), name='input')
    
    # Embedding layer with masking
    x = layers.Embedding(
        input_dim=vocab_size,
        output_dim=config['embedding_dim'],
        mask_zero=True,
        name='embedding'
    )(input_layer)
    
    x = layers.SpatialDropout1D(0.2, name='spatial_dropout')(x)
    
    # First Bidirectional LSTM layer
    x = layers.Bidirectional(
        layers.LSTM(
            config['lstm_units'],
            return_sequences=True,
            dropout=config['dropout_rate'],
            recurrent_dropout=config['recurrent_dropout'],
            name='lstm_1'
        ),
        name='bidirectional_1'
    )(x)
    
    # Second Bidirectional LSTM layer
    lstm_out = layers.Bidirectional(
        layers.LSTM(
            config['lstm_units'] // 2,
            return_sequences=True,
            dropout=config['dropout_rate'],
            recurrent_dropout=config['recurrent_dropout'],
            name='lstm_2'
        ),
        name='bidirectional_2'
    )(x)
    
    # Self-Attention mechanism (query, value from same source)
    attention_out = layers.Attention(name='attention')([lstm_out, lstm_out])
    x = layers.GlobalAveragePooling1D(name='global_avg_pool')(attention_out)
    
    # Dense layers with BatchNormalization
    x = layers.Dense(128, activation='relu', name='dense_1')(x)
    x = layers.BatchNormalization(name='batch_norm_1')(x)
    x = layers.Dropout(config['dropout_rate'], name='dropout_1')(x)
    
    x = layers.Dense(64, activation='relu', name='dense_2')(x)
    x = layers.BatchNormalization(name='batch_norm_2')(x)
    x = layers.Dropout(config['dropout_rate'], name='dropout_2')(x)
    
    # Output layer
    output = layers.Dense(len(CATEGORIES), activation='softmax', name='output')(x)
    
    # Create model
    model = keras.Model(inputs=input_layer, outputs=output, name='dream_analysis_model')
    
    # Compile with optimizer (no label smoothing for SparseCategoricalCrossentropy)
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
    print("Improvements: Bidirectional LSTM (2  layers) + Self-Attention + BatchNorm")
    
    return model


#TRAIN MODEL - WITH CLASS WEIGHTING
def train_model(model, X_train, y_train, config):
    print("\nStarting training with class weighting...")
    print(f"Training samples: {len(X_train)}")
    print(f"Validation split: {config['validation_split']*100:.0f}%")
    print(f"Epochs: {config['epochs']}")
    print(f"Batch size: {config['batch_size']}")
    
    # Calculate class weights to handle imbalance
    from sklearn.utils.class_weight import compute_class_weight
    from sklearn.model_selection import train_test_split
    
    # Compute balanced weights
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = dict(enumerate(class_weights))
    
    # AGGRESSIVE REBALANCING to fix 71% neutral problem
    neutral_idx = CATEGORIES.index('neutral')
    anxiety_idx = CATEGORIES.index('anxiety')
    stress_idx = CATEGORIES.index('stress')
    fear_idx = CATEGORIES.index('fear')
    
    # Calculate frequency ratios
    neutral_count = np.sum(y_train == neutral_idx)
    anxiety_count = np.sum(y_train == anxiety_idx)
    ratio = neutral_count / anxiety_count  # Should be ~35x
    
    # DRASTICALLY reduce neutral (it's 71% of data)
    class_weight_dict[neutral_idx] *= 0.3  # Cut by 70%!
    
    # SIGNIFICANTLY boost minorities
    class_weight_dict[anxiety_idx] *= 3.0   # Triple anxiety (only 2%)
    class_weight_dict[stress_idx] *= 1.5    # Boost stress
    class_weight_dict[fear_idx] *= 1.5      # Boost fear
    
    print("\n⚖️  Class weights (AGGRESSIVE rebalancing):")
    for idx, cat in enumerate(CATEGORIES):
        count = np.sum(y_train == idx)
        weight = class_weight_dict.get(idx, 1.0)
        pct = (count / len(y_train)) * 100
        print(f"   {cat:10s} {count:5d} ({pct:4.1f}%) → weight={weight:.3f}")
    
    print(f"\n💡 INTELLIGENT Training Strategy:")
    print(f"   - neutral: 71% data → weight cut by 70% (force model to be cautious)")
    print(f"   - anxiety: 2% data → weight × 3 (force model to learn)")
    print(f"   - Label smoothing: {config['label_smoothing']} (prevent overconfidence)")
    print(f"   - Focal loss: gamma={config['focal_loss_gamma']} (focus on hard examples)")
    print(f"   → Model will be MUCH smarter, not default to neutral")
    
    # Stratified split for better validation
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train,
        test_size=config['validation_split'],
        random_state=42,
        stratify=y_train
    )
    
    print(f"\nAfter split: {len(X_tr)} training, {len(X_val)} validation")
    
    #Callbacks - MORE PATIENCE for better convergence
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=10,  # More patience for complex learning
            restore_best_weights=True,
            verbose=1,
            min_delta=0.001  # Only stop if no improvement > 0.1%
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=4,  # More patience before reducing LR
            verbose=1,
            min_lr=0.00001,
            min_delta=0.001
        ),
        keras.callbacks.ModelCheckpoint(
            'best_model.keras',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
    ]
    
    #Train with class weights and stratified validation
    history = model.fit(
        X_tr, y_tr,
        epochs=config['epochs'],
        batch_size=config['batch_size'],
        validation_data=(X_val, y_val),
        class_weight=class_weight_dict,  # Apply class weights
        callbacks=callbacks,
        verbose=1
    )
    
    #Final metrics with per-class evaluation
    final_train_acc = history.history['accuracy'][-1]
    final_val_acc = history.history['val_accuracy'][-1]
    best_val_acc = max(history.history['val_accuracy'])
    best_epoch = history.history['val_accuracy'].index(best_val_acc) + 1
    
    print("\n" + "="*60)
    print("TRAINING COMPLETED!")
    print("="*60)
    print(f"   Final Training Accuracy: {final_train_acc*100:.2f}%")
    print(f"   Final Validation Accuracy: {final_val_acc*100:.2f}%")
    print(f"   Best Validation Accuracy: {best_val_acc*100:.2f}% (epoch {best_epoch})")
    
    # Evaluate on validation set per-class
    print("\n📊 Per-Category Validation Performance:")
    y_pred = np.argmax(model.predict(X_val, verbose=0), axis=1)
    
    from sklearn.metrics import classification_report
    report = classification_report(y_val, y_pred, target_names=CATEGORIES, digits=3)
    print(report)
    
    # Check neutral prediction rate
    neutral_predictions = np.sum(y_pred == neutral_idx)
    neutral_rate = (neutral_predictions / len(y_pred)) * 100
    print(f"\n⚠️  Neutral prediction rate: {neutral_rate:.1f}%")
    if neutral_rate > 40:
        print(f"   ⚠️  WARNING: Still predicting neutral too often!")
    else:
        print(f"   ✅ Good! Neutral predictions are balanced.")
    
    return history


#SAVE MODEL
def save_model_for_tfjs(model, tokenizer, save_dir='trained_model'):
    """Save model in TensorFlow.js format"""
    print(f"\nSaving model to {save_dir}...")
    
    #Create directory
    os.makedirs(save_dir, exist_ok=True)
    
    #save model in TF.js format
    import tensorflowjs as tfjs
    tfjs.converters.save_keras_model(model, save_dir)
    
    #Save tokenizer
    tokenizer_config = {
        'word_index': tokenizer.word_index,
        'index_word': {int(k): v for k, v in tokenizer.index_word.items()},
        'max_words': CONFIG['max_words'],
        'max_len': CONFIG['max_len'],
    }
    
    with open(f'{save_dir}/tokenizer.json', 'w', encoding='utf-8') as f:
        json.dump(tokenizer_config, f, ensure_ascii=False, indent=2)
    
    #Save config
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
    print(f"Files: model.json, group1-shard*.bin, tokenizer.json, config.json")
    
    #Create zip for download
    zip_path = 'trained_model.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(save_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(save_dir))
                zipf.write(file_path, arcname)
    
    print(f"\nCreated ZIP file: {zip_path}")
    
    return save_dir


#MAIN 
def main():
    """Main training pipeline"""
    print("\n" + "="*60)
    print("DREAM ANALYSIS MODEL TRAINING")
    print("Platform Google Colab (GPU/TPU)")
    print("Dataset tu tao + DreamBank")
    print("="*60)
    
    # Install tensorflowjs converter
    print("\nInstall TensorFlow.js converter")
    os.system('pip install -q tensorflowjs')
    
    #Load data
    texts, labels = load_data('dream_training_data.json')
    
    #Create tokenizer
    tokenizer, vocab_size = create_tokenizer(texts, CONFIG['max_words'])
    
    #Prepare sequences
    X = prepare_sequences(texts, tokenizer, CONFIG['max_len'])
    y = np.array(labels)
    
    #Build model
    model = build_model(vocab_size, CONFIG)
    
    #Train model
    history = train_model(model, X, y, CONFIG)
    
    #Save model
    save_dir = save_model_for_tfjs(model, tokenizer)
    
    print("\n" + "="*60)
    print("xong")
    print("="*60)

#RUN
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
