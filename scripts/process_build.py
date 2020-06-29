# This script santises the sympy latex in the HTML files prior to building the site
import os
from bs4 import BeautifulSoup
filepath = "./_build/"

def sanitize_latex(filename):
    is_modified = False
    soup = BeautifulSoup(open(filename), 'html.parser')
    for latex in soup.find_all('div', {'class':'output_latex'}):
        if "{{" in latex.string:
            sanitized_latex = latex.string.replace("{{", "{ {")
            latex.string = sanitized_latex
            is_modified = True
    if is_modified:
        print(filename)
        with open(filename, "w") as f:
            f.write(str(soup))

for directory in os.listdir(filepath):
    if os.path.isdir(filepath + directory):
        for file in os.listdir(filepath + directory):
            if str(file).endswith(".html"):
                sanitize_latex(filepath + directory + "/" + file)

