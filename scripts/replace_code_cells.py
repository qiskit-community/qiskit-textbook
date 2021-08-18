#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: frankharkins

This belongs in the "scripts" folder, it replaces all the code cells
in notebooks in <target-dir> with the code cells in <base-dir>, but
tries to preserve the comments from the cells in <target-dir>.

You will need to check each notebook individually afterwards as this
doesn't deal with edge cases well (of which there are a few in the
textbook).
"""

import time
import nbformat
import io
from traitlets.config import Config
from nbconvert.preprocessors import ExecutePreprocessor
content_basedir = "../content/"
target_basedir = "../i18n/locales/ja/"
exclude = []

def preserve_comments(base, target):
    base, target = base.split('\n'), target.split('\n')
    out = ''
    offset = 0
    for idx, line in enumerate(base):
        idx += offset
        if idx >= len(target):
            for line in base[idx-offset:]:
                out += line + '\n'
            break
        if target[idx].strip().startswith('#') and not line.strip().startswith('#'):
            out += target[idx] + '\n'
            offset += 1
            idx += 1
        if '#' in line:
            front = line.split('#')[0]
            back = target[idx].split('#', 1)[1]
            line = front + '#' + back
        elif '#' in target[idx]:
            line += '  #' + target[idx].split('#', 1)[1]
        out += line + '\n'
    return out.strip('\n')


def replace_code_cells(basefile, targetfile):
    with open(basefile) as f:
        basenb = nbformat.read(f, as_version=4)
    # get all code cells from base file
    base_code_cells = []
    for cell in basenb.cells:
        if cell.cell_type == 'code':
            base_code_cells.append(cell)
    # overwrite the target notebook's code cells
    try:
        with open(targetfile) as f:
            targetnb = nbformat.read(f, as_version=4)
    except:
        print(f"No match for '{basefile.split('/')[-1]}'")
        return 1
    for cell in targetnb.cells:
        if cell.cell_type == 'code':
            try:
                cell.source = preserve_comments(base_code_cells[0].source, cell.source)
                base_code_cells.pop(0)
            except:
                try:
                    cell.source = base_code_cells.pop(0).source
                except IndexError:
                    base_code_cells = ['need to make list len > 0']
                    break
    if len(base_code_cells) == 0:
        print(f"Replaced code cells in '{basefile.split('/')[-1]}'")
        with open(targetfile, 'w', encoding='utf-8') as f:
            nbformat.write(targetnb, f)
        return 0
    else:
        print(f"[Error] Number of code cells in '{basefile.split('/')[-1]}' didn't match, this needs doing manually.")
        return 1

if __name__ == '__main__':
    import os
    import sys
    t0 = time.time()
    total_files, replaced_files = 0, 0

    if len(sys.argv) != 3:
        sys.exit("Usage: python3 replace_code_cells.py <base-dir> <target-dir>")
    base_dir = sys.argv[1]
    target_dir = sys.argv[2]
    
    for (dirpath, _, filenames) in os.walk(base_dir):
        for name in filenames:
            if name.endswith(".ipynb"):
                base_filepath = os.path.join(dirpath, name)
                target_filepath = os.path.join(target_dir + dirpath.lstrip(base_dir), name)
                if any(e in filepath for e in exclude):
                    print("SKIPPING:" + name)
                    continue
                total_files += 1
                if replace_code_cells(base_filepath, target_filepath) == 0:
                    replaced_files += 1
    t1 = time.time()
    running_time = t1-t0

    print("Finished in %.2f seconds" % running_time)
    print("%i files were accessed, %i had code cells replaced." % (total_files, replaced_files))
