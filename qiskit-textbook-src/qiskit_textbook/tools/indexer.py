# run this to scrape the notebooks for keywords and create and index

import os
import json

index = {'Topics':{},'Commands':{}}
for path, dirs, files in os.walk('../../../'):
    for file in files:
        if file[-6:]=='.ipynb':
            with open(path+'/'+file) as json_file:  
                data = str(json.load(json_file))
                start = data.find('keywords = ')
                if ('checkpoint' not in file) and start!=-1:
                    data = data[(start+11):]
                    end = data.find("}")
                    data = data[:(end+1)]
                    keywords = eval(data)
                    rpath = 'content/'+(path+'/'+file).split('content/')[1]
                    for kw_type in index:
                        for topic in keywords[kw_type]:
                            try:
                                index[kw_type][topic].append(rpath)
                            except:
                                index[kw_type][topic] = [rpath]
                                
md = ''                        
for kw_type in ['Commands','Topics']:
    md += '\n## Index by '+kw_type+'\n\n'
    for kw in sorted(index[kw_type]):
        entry = '### ' + kw
        for rpath in sorted(index[kw_type][kw]):
            entry += '\n* [' + rpath.split('/')[-1].split('.')[0].replace('_',' ') + '](' + rpath + ')'
        md += entry+'\n\n'

with open('../../../index.md','w') as file:
    file.write(md)