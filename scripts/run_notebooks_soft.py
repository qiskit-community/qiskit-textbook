#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Aug 21 15:42:00 2020

@author: frankharkins

This belongs in the "scripts" folder, it runs every notebook in <base-dir> unless it contains errors.
Cells with `uses-hardware` tags are ignored, and the cell outputs are NOT updated.

If <toc-path> is provided, only notebooks whose names are found in the toc file will be run.

"""

import time
import nbformat
import io
from traitlets.config import Config
from nbconvert.preprocessors import ExecutePreprocessor
from datetime import datetime
filepath = "../content/"

def run_notebook(filename):
    c = Config()
    c.TagRemovePreprocessor.remove_cell_tags = ("remove_cell", "uses-hardware")
    c.TagRemovePreprocessor.enabled=True
    c.preprocessors = ['TagRemovePreprocessor']
    execution_failed = False

    with open(filename) as f:
        nb = nbformat.read(f, as_version=4)

    for cell in nb.cells.copy():
        if "uses-hardware" in cell.metadata.get("tags", []):
            nb.cells.remove(cell)
    try:
        ep = ExecutePreprocessor(timeout=None, kernel_name='python3')
        ep.preprocess(nb, {'metadata': {'path': './'}})
    except Exception as e:
        print("[" + datetime.now().time().strftime('%H:%M') + "] " + "Error in file '", filename, "': ", str(e).split('\n')[-2])
        return 1
    return 0

if __name__ == '__main__':
    import os
    import sys
    t0 = time.time()
    total_files, working_files = 0, 0

    if len(sys.argv) < 2:
        sys.exit("Usage: python3 run_notebooks.py <content-dir> <toc-filepath>")
    if len(sys.argv) == 3:
        toc_filepath = sys.argv[2]
        with open(toc_filepath) as f:
            toc_txt = f.read()
    else:
        toc_txt = None
    base_dir = sys.argv[1]
    
    for (dirpath, _, filenames) in os.walk(base_dir):
        for name in filenames:
            if name.endswith(".ipynb"):
                if toc_txt is None or os.path.splitext(name)[0] in toc_txt:
                    filepath = os.path.join(dirpath, name)
                    print("[" + datetime.now().time().strftime('%H:%M') + "] " + filepath)
                    total_files += 1
                    if run_notebook(filepath) is not 0:
                        sys.exit(os.EX_SOFTWARE)
    t1 = time.time()
    running_time = t1-t0

    print("Finished in %.2f seconds" % running_time)
    sys.exit(os.EX_OK)
