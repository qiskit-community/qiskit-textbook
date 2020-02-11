#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins

This belongs in the "scripts" folder, it removes the figure captions put there by nbconvert

"""

import os
filepath = "../../documentation/"

def remove_figure_captions(filename):
    out = ""
    count = 0
    counting = False
    with open(filename) as f:
        for line in f:
            if line[:11] == ".. figure::":
                counting = True
            if count == 3:
                count = 0
                counting = False
            else:
                out += line
            if counting:
                count += 1
    with open(filename, 'w') as f:
        f.write(out)
    return 0

def replace_contents(filename):
    out = ""
    in_contents = False
    saving_lines = True
    with open(filename) as f:
        for line in f:
            if line == "Contents\n":
                in_contents = True
            if in_contents and not saving_lines and line == "\n":
                saving_lines = True
                in_contents = False
                out += "\n.. contents:: Quick links throughout the document:\n\n"
            if in_contents and line == "\n":
                saving_lines = False
            if saving_lines:
                out += line
    with open(filename, 'w') as f:
        f.write(out)
    return 0

def fix_matrices(filename):
    out = ""
    with open(filename) as f:
        for line in f:
            if "matrix}" in line:
                line = line.replace("\\\\", "\\\\\\\\")
            if line[-3:] == "\\\\\n" and not line[-5:] == "\\\\\\\\\n":
                line = line.replace("\\\\", "\\\\\\\\")
            out += line
    with open(filename, 'w') as f:
        f.write(out)
    return 0

print("Cleaning Up .rst...")
for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file)[-4:] == ".rst":
                fullpath = filepath + directory + "/" + file
                remove_figure_captions(fullpath)
                replace_contents(fullpath)
                fix_matrices(fullpath)
