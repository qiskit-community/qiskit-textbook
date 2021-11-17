from setuptools import setup, find_packages

description = ('A collection of widgets, tools and games for using along '
               'the Qiskit Textbook. See the textbook and a list of '
               'contributors at qiskit.org/textbook')

setup(
  name='qiskit-textbook',
  version='0.1.0',
  author='Qiskit Team',
  author_email='hello@qiskit.org',
  description=description,
  packages=find_packages(),
  install_requires=[
    'qiskit',
    'ipython',
    'ipywidgets',
    'numpy',
    'matplotlib'
  ]
)
