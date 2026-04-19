import json
import os

scratch_dir = 'c:/Users/adminst/GitHub_Repo/OPA-Santorini/OPA-Santorini/brain/9fe06946-d5b8-4d47-95b5-61a5ce4dc92f/scratch'
export_path = 'c:/Users/adminst/GitHub_Repo/OPA-Santorini/OPA-Santorini/menu-translate-import/translations-export.json'

# Load and merge mappings
full_map = {}
for i in range(1, 5):
    with open(f'{scratch_dir}/map_{i}.json', 'r', encoding='utf-8') as f:
        full_map.update(json.load(f))

# Load original data
with open(export_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process categories
for cat in data.get('categories', []):
    label = cat['label']
    if label in full_map:
        trans = full_map[label]
        for lang, text in trans.items():
            if lang not in cat['translations']:
                cat['translations'][lang] = text

# Process dishes
for dish in data.get('dishes', []):
    name = dish['name']
    desc = dish.get('desc')
    
    # Handle name translation
    if name in full_map:
        trans = full_map[name]
        for lang, val in trans.items():
            if lang not in dish['translations']:
                dish['translations'][lang] = {"name": val, "desc": ""}
            else:
                if not dish['translations'][lang].get("name"):
                    dish['translations'][lang]["name"] = val

    # Handle description translation
    if desc and desc in full_map:
        trans = full_map[desc]
        for lang, val in trans.items():
            if lang not in dish['translations']:
                dish['translations'][lang] = {"name": "", "desc": val}
            else:
                if not dish['translations'][lang].get("desc"):
                    dish['translations'][lang]["desc"] = val

# Save updated data
with open(export_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Successfully updated {export_path} with new translations.")
