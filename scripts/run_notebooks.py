#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins

This belongs in the "scripts" folder, it runs every notebook in 'content' unless it contains errors.

*******************************************************************
*** Only run sparingly since it WILL send ~20 jobs off to IBMQX ***
*******************************************************************

"""

import os
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

t0 = time.time()
total_files, working_files = 0, 0

for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file)[-6:] == ".ipynb":
                print("[" + datetime.now().time().strftime('%H:%M') + "] " + filepath + directory + "/" + file)
                total_files += 1
                if run_notebook(filepath + directory + "/" + file) == 1:
                    working_files += 1
t1 = time.time()
running_time = t1-t0

print("Finished in %.2f seconds" % running_time)
print("%i files were processed, %i were run and %i were not run due to errors in the code" % (total_files, working_files, total_files - working_files))
