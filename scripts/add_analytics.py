#!/usr/bin/env python3

"""
This script adds the analytics code snippet in 'analytics.html.part'
to all the HTML file (at the very end of the <head> section) inside a
target folder received as its only parameter.
"""

import os
import sys
import glob


def get_analytics_snippet(file_name):
    file_path = os.path.join(os.path.dirname(__file__), file_name)
    print(f'Obtaining analytics snippet from "{file_path}"')
    with open(file_path, encoding='utf8') as snippet:
        return snippet.read()


def main(target_dir):
    analytics_snippet = get_analytics_snippet('analytics.html.part')
    replacement = f'{analytics_snippet}</head>'
    search_path = os.path.join(os.getcwd(), target_dir)
    glob_spec = f'{search_path}/**/*.html'
    for file_path in glob.glob(glob_spec, recursive=True):
        with open(file_path, encoding='utf8') as html_file:
            contents = html_file.read()

        new_contents = contents.replace('</head>', replacement)

        with open(file_path, mode='w') as html_file:
            print(f'Adding analytics to "{file_path[len(os.getcwd()) + 1:]}"')
            html_file.write(new_contents)


if __name__ == '__main__':
    main(sys.argv[-1])