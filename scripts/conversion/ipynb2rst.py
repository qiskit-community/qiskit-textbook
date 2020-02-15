#!/usr/bin/env python3
"""
Created on Mon Jan 27 16:27:23 2020

@author: frankharkins
@author: Salvador de la Puente <salva@unoyunodiez.com>

This belongs in the "scripts" folder, it sorts out some formatting issues in
the conversion between .ipynb and .rst.
"""

import sys
import os.path
import subprocess
import itertools


def convert_all_files(dirpath):
  for root, _, files in os.walk(dirpath):
    for file_ in files:
      name, ext = os.path.splitext(filepath)
      if ext != '.ipynb':
        continue

      convert_file(os.path.join(root, file_))


def convert_file(filepath):
  name, ext = os.path.splitext(filepath)
  assert ext == '.ipynb', 'This script only works with *.ipynb files.'
  outputpath = f'{name}.rst'
  subprocess.run(
    ['jupyter', 'nbconvert', '--to', 'rst', filepath, '--output', os.path.basename(outputpath)])

  _postprocess(outputpath)


def _postprocess(filepath):
  print('Fixing conversion issues...')

  with open(filepath) as file_:
    lines = map(str.rstrip, file_.readlines())

  print('  Remove figure captions.')
  lines = _remove_figure_captions(lines)

  print('  Generate local TOCs.')
  lines = _replace_contents(lines)

  print('  Fix matrix representation.')
  lines = _fix_matrices(lines)

  with open(filepath, 'w') as file_:
    file_.write('\n'.join(lines))


def _remove_figure_captions(lines):
  out = []
  count = 0
  counting = False
  for line in lines:
    if line.startswith('.. figure::'):
      counting = True

    if count == 3:
      count = 0
      counting = False
    else:
      out.append(line)

    if counting:
      count += 1

  return out


def _replace_contents(lines):
  out = []
  in_contents = False
  emptylines = 0
  contents_added = False
  for line in lines:
    if line == 'Contents':
      in_contents = True

    if in_contents and line == '':
      if emptylines == 0:
        emptylines += 1
      else:
        out.extend(_local_contents())
        in_contents = False
        contents_added = True

    if not in_contents:
      out.append(line)

  if not contents_added:
    return _add_contents(out)

  return out


def _add_contents(lines):
    out = []
    count = 0
    for line in lines:
      count += 1
      out.append(line)
      if count == 2:
        out.extend(_local_contents())

    return out


def _local_contents():
  return (
    '.. contents:: Contents',
    '   :local:',
    '')


def _fix_matrices(lines):
  out = []
  for line in lines:
    if 'matrix}' in line:
      line = line.replace(r'\\', '\\\\')

    if line.endswith(r'\\') and not line.endswith(r'\\\\'):
      line = line.replace(r'\\', r'\\\\')

    out.append(line)

  return out


if __name__ == '__main__':
  path = os.path.normpath(sys.argv[1])
  if os.path.isfile(path):
    convert_file(path)

  if os.path.isdir(path):
    convert_all_files(path)
