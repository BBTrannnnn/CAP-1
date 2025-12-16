import json

file_kaggle = r'C:/Users/User/OneDrive/Desktop/WORKSPACE/Capstone1/CAP-1/BE/src/Script/dream_training_data_kaggle.json'
file_hf = r'C:/Users/User/OneDrive/Desktop/WORKSPACE/Capstone1/CAP-1/BE/src/Script/dream_training_data_hf.json'
file_out = r'C:/Users/User/OneDrive/Desktop/WORKSPACE/Capstone1/CAP-1/BE/src/Script/dream_training_data.json'

def merge_json_files(file1, file2, output):
    with open(file1, 'r', encoding='utf-8') as f1:
        data1 = json.load(f1)
    with open(file2, 'r', encoding='utf-8') as f2:
        data2 = json.load(f2)
    merged = data1 + data2
    with open(output, 'w', encoding='utf-8') as fout:
        json.dump(merged, fout, ensure_ascii=False, indent=2)
    print(f'Đã gộp xong! Tổng số mẫu: {len(merged)}')

if __name__ == '__main__':
    merge_json_files(file_kaggle, file_hf, file_out)