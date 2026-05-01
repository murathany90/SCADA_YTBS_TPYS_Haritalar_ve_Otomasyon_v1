import os

js_path = 'rgdh-monitor.js'
with open(js_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'DEFAULT_CATALOG_PATH' in line:
            path = line.split('=')[1].strip().strip(";'")
            print('JS path:', path)
            print('JS codepoints:', [hex(ord(c)) for c in path])
            break

folder = 'yks_izleme_modul/yks_docs/data1'
for name in os.listdir(folder):
    print('Disk file:', name)
    print('Disk codepoints:', [hex(ord(c)) for c in name])
    if 'BARA' in name.upper():
        print('^^^ This is the BARA file')
