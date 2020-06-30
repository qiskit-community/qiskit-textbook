# This script santises the sympy latex in the HTML files prior to building the site
import os
from bs4 import BeautifulSoup
base_dir = "./_build"

def sanitize_latex(filepath):
    is_modified = False
    soup = BeautifulSoup(open(filepath), 'html.parser')
    for latex in soup.find_all('div', {'class':'output_latex'}):
        if "{{" in latex.string:
            sanitized_latex = latex.string.replace("{{", "{ {")
            latex.string = sanitized_latex
            is_modified = True
    if is_modified:
        with open(filepath, "w") as f:
            f.write(str(soup))

for directory in os.listdir(base_dir):
    dir_path = os.path.join(base_dir, directory)
    if os.path.isdir(dir_path):
        for f in os.listdir(dir_path):
            if str(f).endswith(".html"):
                filepath = os.path.join(dir_path, f)
                sanitize_latex(filepath)

