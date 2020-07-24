#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins

This belongs in the "scripts" folder, it runs every notebook in <base-dir> unless it contains errors.

*******************************************************************
*** Only run sparingly since it WILL send ~20 jobs off to IBMQX ***
*******************************************************************

"""

import time
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
from datetime import datetime
filepath = "../content/"

def run_notebook(filename):
    execution_failed = False
    with open(filename) as f:
        nb = nbformat.read(f, as_version=4)
        try:
            ep = ExecutePreprocessor(timeout=None, kernel_name='python3')
            ep.preprocess(nb, {'metadata': {'path': './'}})
        except Exception as e:
            print("[" + datetime.now().time().strftime('%H:%M') + "] " + "Error in file '", filename, "': ", str(e).split('\n')[-2])
            execution_failed = True
    
    if not execution_failed:
        with open(filename, 'w', encoding='utf-8') as f:
            nbformat.write(nb, f)
        return 1
    return 0


if __name__ == '__main__':
    import os
    import sys
    t0 = time.time()
    total_files, working_files = 0, 0

    if len(sys.argv) != 2:
        sys.exit("Usage: python3 run_notebooks.py <content-dir>")
    base_dir = sys.argv[1]
    
    for (dirpath, _, filenames) in os.walk(base_dir):
        for name in filenames:
            if name.endswith(".ipynb"):
                filepath = os.path.join(dirpath, name)
                print("[" + datetime.now().time().strftime('%H:%M') + "] " + filepath)
                total_files += 1
                if run_notebook(filepath) == 1:
                    working_files += 1
    t1 = time.time()
    running_time = t1-t0

    print("Finished in %.2f seconds" % running_time)
    print("%i files were accessed, %i were updated and %i were not updated due to errors." % (total_files, working_files, total_files - working_files))
