import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// CONFIG - Optimized for better accuracy
const CONFIG = {
  maxWords: 1000,        // Vocabulary size  
  maxLen: 50,            // Max sequence length
  embeddingDim: 64,      // Embedding dimension
  lstmUnits: 128,        // LSTM units               
  epochs: 20,            // Training epochs (tăng từ 10 → 20)
  batchSize: 64,         // Batch size
  validationSplit: 0.2,  // 20% for validation
  learningRate: 0.0008,  // Learning rate (giảm từ 0.001 → 0.0008 để học chậm hơn)
};

const CATEGORIES = ['stress', 'fear', 'anxiety', 'sadness', 'happy', 'neutral', 'confusion'];


// LOAD DATA
function loadData() {
  console.log('\n Loading training data...');
  const dataPath = path.join(__dirname, '../../dream_training_data.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log(` Loaded ${rawData.length} dreams`);
  
  // Split texts and labels
  const texts = rawData.map(d => d.text.toLowerCase());
  const labels = rawData.map(d => CATEGORIES.indexOf(d.category));
  
  return { texts, labels };
}


// TOKENIZATION
class SimpleTokenizer {
  constructor(maxWords = 1000) {
    this.maxWords = maxWords;
    this.wordIndex = {};
    this.indexWord = {};
  }
  
  fitOnTexts(texts) {
    console.log('\n Building vocabulary...');
    const wordCounts = {};
    
    // Count word frequencies
    texts.forEach(text => {
      const words = text.toLowerCase().match(/\S+/g) || [];
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    // Sort by frequency and take top maxWords
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxWords - 1); // Reserve index 0 for padding
    
    // Build word index (1-indexed, 0 reserved for padding)
    this.wordIndex = { '<PAD>': 0 };
    this.indexWord = { 0: '<PAD>' };
    
    sortedWords.forEach(([word], idx) => {
      const index = idx + 1;
      this.wordIndex[word] = index;
      this.indexWord[index] = word;
    });
    
    console.log(` Vocabulary size: ${Object.keys(this.wordIndex).length} words`);
  }
  
  textsToSequences(texts) {
    return texts.map(text => {
      const words = text.toLowerCase().match(/\S+/g) || [];
      return words.map(word => this.wordIndex[word] || 0).filter(idx => idx !== 0);
    });
  }
}

function padSequences(sequences, maxLen) {
  return sequences.map(seq => {
    if (seq.length > maxLen) {
      return seq.slice(0, maxLen);
    } else {
      return [...seq, ...Array(maxLen - seq.length).fill(0)];
    }
  });
}


// BUILD MODEL
function buildModel() {
  console.log('\n  Building LSTM model...');
  
  const model = tf.sequential();
  
  // Embedding layer
  model.add(tf.layers.embedding({
    inputDim: CONFIG.maxWords,
    outputDim: CONFIG.embeddingDim,
    inputLength: CONFIG.maxLen,
    maskZero: true, // Ignore padding
  }));
  
  // LSTM layer
  model.add(tf.layers.lstm({
    units: CONFIG.lstmUnits,
    dropout: 0.2,
    recurrentDropout: 0.2,
  }));
  
  // Dense layers
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
  }));
  
  model.add(tf.layers.dropout({ rate: 0.5 }));
  
  // Output layer (7 categories)
  model.add(tf.layers.dense({
    units: CATEGORIES.length,
    activation: 'softmax',
  }));
  
  // Compile
  model.compile({
    optimizer: tf.train.adam(CONFIG.learningRate),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  console.log('\n Model Architecture:');
  model.summary();
  
  return model;
}

// ========================================
// TRAIN MODEL
// ========================================
async function trainModel() {
  console.log('\n DREAM ANALYSIS MODEL TRAINING');
  console.log('=' .repeat(50));
  
  // Load data
  const { texts, labels } = loadData();
  
  // Tokenize
  const tokenizer = new SimpleTokenizer(CONFIG.maxWords);
  tokenizer.fitOnTexts(texts);
  
  const sequences = tokenizer.textsToSequences(texts);
  const paddedSequences = padSequences(sequences, CONFIG.maxLen);
  
  // Convert to tensors
  console.log('\n Converting to tensors...');
  const X = tf.tensor2d(paddedSequences, undefined, 'float32');
  const y = tf.tensor1d(labels, 'float32');
  
  console.log(` X shape: [${X.shape}]`);
  console.log(` y shape: [${y.shape}]`);
  
  // Build model
  const model = buildModel();
  
  // Train
  console.log('\n Training model...');
  console.log(`   Epochs: ${CONFIG.epochs}`);
  console.log(`   Batch size: ${CONFIG.batchSize}`);
  console.log(`   Validation split: ${CONFIG.validationSplit * 100}%\n`);
  
  const history = await model.fit(X, y, {
    epochs: CONFIG.epochs,
    batchSize: CONFIG.batchSize,
    validationSplit: CONFIG.validationSplit,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const acc = (logs.acc * 100).toFixed(2);
        const valAcc = (logs.val_acc * 100).toFixed(2);
        const loss = logs.loss.toFixed(4);
        const valLoss = logs.val_loss.toFixed(4);
        
        console.log(
          `Epoch ${(epoch + 1).toString().padStart(2)}/${CONFIG.epochs} - ` +
          `loss: ${loss} - acc: ${acc}% - ` +
          `val_loss: ${valLoss} - val_acc: ${valAcc}%`
        );
      },
    },
  });
  
  // Save model
  console.log('\n💾 Saving model...');
  const modelDir = path.join(__dirname, '../../trained_model');
  
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  
  // Save using proper LayersModel format
  const saveHandler = tf.io.withSaveHandler(async (modelArtifacts) => {
    // Save model.json
    const modelJsonPath = path.join(modelDir, 'model.json');
    const weightsManifest = [{
      paths: ['weights.bin'],
      weights: modelArtifacts.weightSpecs
    }];
    
    fs.writeFileSync(modelJsonPath, JSON.stringify({
      modelTopology: modelArtifacts.modelTopology,
      weightsManifest: weightsManifest,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js tfjs-layers v4.0.0',
      convertedBy: null
    }, null, 2));
    
    // Save weights.bin
    const weightsPath = path.join(modelDir, 'weights.bin');
    fs.writeFileSync(weightsPath, Buffer.from(modelArtifacts.weightData));
      
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  });
  
  await model.save(saveHandler);
  console.log(`✅ Model saved to: ${modelDir}`);
  
  // Save tokenizer
  const tokenizerPath = path.join(__dirname, '../../trained_model/tokenizer.json');
  fs.writeFileSync(
    tokenizerPath,
    JSON.stringify({
      wordIndex: tokenizer.wordIndex,
      maxWords: CONFIG.maxWords,
      maxLen: CONFIG.maxLen,
    }, null, 2)
  );
  console.log(` Tokenizer saved to: ${tokenizerPath}`);
  
  // Save config
  const configPath = path.join(__dirname, '../../trained_model/config.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      ...CONFIG,
      categories: CATEGORIES,
      totalSamples: texts.length,
      trainedAt: new Date().toISOString(),
    }, null, 2)
  );
  console.log(` Config saved to: ${configPath}`);
  
  // Final metrics
  const finalAcc = (history.history.acc[history.history.acc.length - 1] * 100).toFixed(2);
  const finalValAcc = (history.history.val_acc[history.history.val_acc.length - 1] * 100).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log(' TRAINING COMPLETED!');
  console.log('='.repeat(50));
  console.log(` Final Training Accuracy: ${finalAcc}%`);
  console.log(` Final Validation Accuracy: ${finalValAcc}%`);
  console.log(` Model location: ${modelDir}`);
  console.log('\n Next steps:');
  console.log('   1. Create Dream model (MongoDB)');
  console.log('   2. Create Dream controller');
  console.log('   3. Create API routes');
  console.log('   4. Test with real dreams\n');
  
  // Cleanup
  X.dispose();
  y.dispose();
}


// RUN
trainModel().catch(err => {
  console.error(' Training failed:', err);
  process.exit(1);
});
