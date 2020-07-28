# This script santises the sympy latex in the HTML files prior to building the site
import os
import sys
from bs4 import BeautifulSoup

def sanitize_latex(filepath):
    '''
    Replace {{ with { { inside LaTeX outputs not to confuse Jekyll about what
    should be interpolated.
    '''
    is_modified = False
    soup = BeautifulSoup(open(filepath), 'html.parser')
    for latex in soup.find_all('div', {'class': 'output_latex'}):
        if r'{{' in latex.string:
            sanitized_latex = latex.string.replace(r'{{', '{ {')
            latex.string = sanitized_latex
            is_modified = True
    if is_modified:
        print(f'sanitize_latex: `{filepath}`')
        with open(filepath, 'w') as f:
            f.write(str(soup))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('Usage: python3 postprocess_html.py <build-dir>')
    base_dir = sys.argv[1]
    for (dirpath, _, filenames) in os.walk(base_dir):
        for name in filenames:
            if not name.endswith('.html'):
                continue
            filepath = os.path.join(dirpath, name)
            sanitize_latex(filepath)

