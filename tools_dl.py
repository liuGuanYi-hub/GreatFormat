import urllib.request
import re
import os

url = 'https://jojowiki.com/Josuke_Higashikata'
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf8', errors='ignore')
        matches = set(re.findall(r'https://static\.jojowiki\.com/images/[a-z0-9]/[a-z0-9]+/[^\"\'\s\)]+', html, re.I))
        for m in matches:
            if 'Josuke' in m or 'DU' in m or 'Anime' in m:
                print('Match:', m)
except Exception as e:
    print('Error:', e)
