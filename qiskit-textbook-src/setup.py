from setuptools import setup, find_packages

setup(
  name='qiskit-textbook',
  version='0.1.0',
  description='''A collection of widgets, tools and games for using along
  the Qiskit Textbook. Visit it at qiskit.org/textbook''',
  packages=find_packages(),
  install_requires=[
    'qiskit',
    'ipython',
    'ipywidgets',
    'numpy',
    'matplotlib'
  ]
)
