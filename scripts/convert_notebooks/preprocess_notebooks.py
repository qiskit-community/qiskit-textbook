#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins

This belongs in the "scripts" folder, it removes the figure captions put there by nbconvert

"""

import os
filepath = "../../documentation/"

def add_newlines_to_equations(filename):
    out = ""
    in_equation = False
    with open(filename) as f:
        for line in f:
            if line == "    \"$$\\n\",\n":
                if in_equation:
                    line.replace("$$","$$\\n")
                else:
                    line.replace("$$","\\n$$")
                in_equation = not in_equation
            out += line
    with open(filename, 'w') as f:
        f.write(out)

def fix_fuckup(filename):
    out = ""
    with open(filename) as f:
        for line in f:
            line = line.replace("$$\n", "$$")
            if line[0] == "$":
                out = out[:-1]
            out += line.replace("\"\n", "\"")
                
    with open(filename, 'w') as f:
        f.write(out)

print("\nPreprocessing Notebooks Before Conversion...")
for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file)[-6:] == ".ipynb":
                add_newlines_to_equations(filepath + directory + "/" + file)
                #fix_fuckup(filepath + directory + "/" + file)
