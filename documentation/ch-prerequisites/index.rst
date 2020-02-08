.. toctree::
  :hidden:

  Qiskit <qiskit>
  Linear Algebra <linear_algebra>

Introduction to Python and Jupyter notebooks
============================================

Python is a programming language where you don’t need to compile. You
can just run it line by line (which is how we can use it in a notebook).
So if you are quite new to programming, Python is a great place to
start. The current version is Python 3, which is what we’ll be using
here.

One way to code in Python is to use a Jupyter notebook. This is probably
the best way to combine programming, text and images. In a notebook,
everything is laid out in cells. Text cells and code cells are the most
common. If you are viewing this section as a Jupyter notebook, the text
you are now reading is in a text cell. A code cell can be found just
below.

To run the contents of a code cell, you can click on it and press Shift
+ Enter. Or if there is a little arrow thing on the left, you can click
on that.

.. code:: python

   1 + 1

If you are viewing this section as a Jupyter notebook, execute each of
the code cells as you read through.

.. code:: python

   a = 1
   b = 0.5
   a + b

Above we created two variables, which we called ``a`` and ``b``, and
gave them values. Then we added them. Simple arithmetic like this is
pretty straightforward in Python.

Variables in Python come in many forms. Below are some examples.

.. code:: python

   an_integer = 42 # Just an integer
   a_float = 0.1 # A non-integer number, up to a fixed precision
   a_boolean = True # A value that can be True or False
   a_string = '''just enclose text between two 's, or two "s, or do what we did for this string''' # Text
   none_of_the_above = None # The absence of any actual value or variable type

As well as numbers, another data structure we can use is the *list*.

.. code:: python

   a_list = [0,1,2,3]

Lists in Python can contain any mixture of variable types.

.. code:: python

   a_list = [ 42, 0.5, True, [0,1], None, 'Banana' ]

Lists are indexed from ``0`` in Python (unlike languages such as
Fortran). So here’s how you access the ``42`` at the beginning of the
above list.

.. code:: python

   a_list[0]

A similar data structure is the *tuple*.

.. code:: python

   a_tuple = ( 42, 0.5, True, [0,1], None, 'Banana' )
   a_tuple[0]

A major difference between the list and the tuple is that list elements
can be changed

.. code:: python

   a_list[5] = 'apple'

   print(a_list)

whereas tuple elements cannot

.. code:: python

   a_tuple[5] = 'apple'

Also we can add an element to the end of a list, which we cannot do with
tuples.

.. code:: python

   a_list.append( 3.14 )

   print(a_list)

Another useful data structure is the *dictionary*. This stores a set of
*values*, each labeled by a unique *key*.

Values can be any data type. Keys can be anything sufficiently simple
(integer, float, Boolean, string). It cannot be a list, but it *can* be
a tuple.

.. code:: python

   a_dict = { 1:'This is the value, for the key 1', 'This is the key for a value 1':1, False:':)', (0,1):256 }

The values are accessed using the keys

.. code:: python

   a_dict['This is the key for a value 1']

New key/value pairs can be added by just supplying the new value for the
new key

.. code:: python

   a_dict['new key'] = 'new_value'

To loop over a range of numbers, the syntax is

.. code:: python

   for j in range(5):
       print(j)

Note that it starts at 0 (by default), and ends at n-1 for ``range(n)``.

You can also loop over any ‘iterable’ object, such as lists

.. code:: python

   for j in a_list:
       print(j)

or dictionaries

.. code:: python

   for key in a_dict:
       value = a_dict[key]
       print('key =',key)
       print('value =',value)
       print()

Conditional statements are done with ``if``, ``elif`` and ``else`` with
the following syntax.

.. code:: python

   if 'strawberry' in a_list:
       print('We have a strawberry!')
   elif a_list[5]=='apple':
       print('We have an apple!')
   else:
       print('Not much fruit here!')

Importing packages is done with a line such as

.. code:: python

   import numpy

The ``numpy`` package is important for doing maths

.. code:: python

   numpy.sin( numpy.pi/2 )

We have to write ``numpy.`` in front of every numpy command so that it
knows to find that command defined in ``numpy``. To save writing, it is
common to use

.. code:: python

   import numpy as np

   np.sin( np.pi/2 )

Then you only need the shortened name. Most people use ``np``, but you
can choose what you like.

You can also pull everything straight out of ``numpy`` with

.. code:: python

   from numpy import *

Then you can use the commands directly. But this can cause packages to
mess with each other, so use with caution.

.. code:: python

   sin( pi/2 )

If you want to do trigonometry, linear algebra, etc, you can use
``numpy``. For plotting, use ``matplotlib``. For graph theory, use
``networkx``. For quantum computing, use ``qiskit``. For whatever you
want, there will probably be a package to help you do it.

A good thing to know about in any language is how to make a function.

Here’s a function, whose name was chosen to be ``do_some_maths``, whose
inputs are named ``Input1`` and ``Input2`` and whose output is named
``the_answer``.

.. code:: python

   def do_some_maths ( Input1, Input2 ):
       the_answer = Input1 + Input2
       return the_answer

It’s used as follows

.. code:: python

   x = do_some_maths(1,72)
   print(x)

If you give a function an object, and the function calls a method of
that object to alter it’s state, the effect will persist. So if that’s
all you want to do, you don’t need to ``return`` anything. For example,
let’s do it with the ``append`` method of a list.

.. code:: python

   def add_sausages ( input_list ):
       if 'sausages' not in input_list:
           input_list.append('sausages')

.. code:: python

   print('List before the function')
   print(a_list)

   add_sausages(a_list) # function called without an output

   print('\nList after the function')
   print(a_list)

Randomness can be generated using the ``random`` package.

.. code:: python

   import random

.. code:: python

   for j in range(5):
       print('* Results from sample',j+1)
       print('\n    Random number from 0 to 1:', random.random() )
       print("\n    Random choice from our list:", random.choice( a_list ) )
       print('\n')

These are the basics. Now all you need is a search engine, and the
intuition to know who is worth listening to on Stack Exchange. Then you
can do anything with Python. Your code might not be the most ‘Pythonic’,
but only Pythonistas really care about that.
