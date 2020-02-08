import sys
import os.path
from docutils.core import publish_doctree

def is_code_block(node):
    return (node.tagname == 'literal_block'
            and 'code' in node.attributes['classes']
            and 'python' in node.attributes['classes'])

def main():
    path = sys.argv[1]
    with open(path) as file:
        source = file.read()
    
    print(f'Reading {path}')
    doctree = publish_doctree(source)
    code_blocks = doctree.traverse(condition=is_code_block)
    source_code = [block.astext() for block in code_blocks]

    if not source_code:
        print('No Python code found. Skipping.')
        return

    (root, _) = os.path.splitext(path)
    target_path = root + '.py'
    print(f'Writing {target_path}')
    with open(target_path, 'w') as file:
        file.write('\n'.join(source_code))


if __name__ == '__main__':
    main()
