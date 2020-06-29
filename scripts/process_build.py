# This script santises the sympy latex in the HTML files prior to building the site
import os
filepath = "./_build/"

def sanitize_latex(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
        newlines = []
        for line in lines:
            if line.startswith('$'):
                line = line.replace('{{', '{ {')
            newlines.append(line)
    with open(filename, 'w') as f:
        f.writelines(newlines)

for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file).endswith(".html"):
                sanitize_latex(filepath + directory + "/" + file)

