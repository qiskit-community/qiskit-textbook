# This script santises the sympy latex in the HTML files prior to building the site
import os
from html.parser import HTMLParser
filepath = "./_build/"

def sanitize_latex(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
        newlines = []
        for i, line in enumerate(lines):
            if "output_latex" in lines[i-1] and line.startswith('$'):
                line = line.replace('{{', '{ {')
            newlines.append(line)
    with open(filename, 'w') as f:
        f.writelines(newlines)

for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file).endswith(".html"):
                sanitize_latex(filepath + directory + "/" + file)
