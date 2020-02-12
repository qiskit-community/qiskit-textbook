#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins

This belongs in the "scripts" folder, it removes the figure captions put there by nbconvert

"""

import os
filepath = "../../documentation/"

def html_img_to_md(filename):
    out = ""
    with open(filename) as f:
        image_number = 1
        for line in f:
            if "<img src=" in line:
                img_path = line.split("\"")[2]
                new_line = "    \"![" + "image" + str(image_number) + "](" + img_path[:-1] + ")\\n\""
                if line[-2] == ",":
                    new_line += ",\n"
                else:
                    new_line += "\n"
                line = new_line
                image_number += 1
            out += line
    with open(filename, 'w') as f:
        f.write(out)

print("\nPreprocessing Notebooks Before Conversion...")
for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file)[-6:] == ".ipynb":
                html_img_to_md(filepath + directory + "/" + file)
