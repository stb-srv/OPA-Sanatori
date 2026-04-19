import json

with open('c:/Users/adminst/GitHub_Repo/OPA-Santorini/OPA-Santorini/menu-translate-import/translations-export.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

unique_texts = set()

for cat in data.get('categories', []):
    unique_texts.add(cat['label'])

for dish in data.get('dishes', []):
    unique_texts.add(dish['name'])
    if dish.get('desc'):
        unique_texts.add(dish['desc'])

sorted_texts = sorted(list(unique_texts))
with open('unique_texts.txt', 'w', encoding='utf-8') as f:
    for text in sorted_texts:
        f.write(text + '\n')

print(f"Extracted {len(sorted_texts)} unique strings.")
