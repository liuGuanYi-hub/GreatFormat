import re

path = r'C:\Users\ZZD\.gemini\antigravity\brain\561beee0-9b63-453e-b78f-5c7d37969c58\.system_generated\steps\349\content.md'
with open(path, 'r', encoding='utf8') as f:
    text = f.read()

urls = re.findall(r'https://static\.jojowiki\.com/images/[^\s\)]+', text)
for u in set(urls):
    if 'Josuke' in u or 'DU' in u:
        print(u)
