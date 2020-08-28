#!/usr/bin/env python3
from IPython.display import display, Markdown, Math
from qiskit import QuantumCircuit
import numpy as np
import math
from fractions import Fraction

def vector2latex(vector, precision=5, pretext="", display_output=True):
    """replace with array_to_latex"""
    out_latex = "\n$$ " + pretext
    out_latex += "\\begin{bmatrix}\n"
    for amplitude in vector:
        amplitude = np.real_if_close(amplitude)
        amp_mod = np.mod(np.real(amplitude), 1)
        if (np.isclose(amp_mod, 0) or np.isclose(amp_mod, 1)) and np.isclose(np.imag(amplitude), 0):
            out_latex += str(int(np.round(amplitude))) + " \\\\\n"
        else:
            out_latex += '{:.{}f}'.format(amplitude, precision) + " \\\\\n"
    out_latex = out_latex[:-4] # remove trailing ampersands
    out_latex += "\end{bmatrix} $$"
    if display_output:
        display(Math(out_latex))
    else:
        return out_latex

def simon_oracle(b):
    """returns a Simon oracle for bitstring b"""
    b = b[::-1] # reverse b for easy iteration
    n = len(b)
    qc = QuantumCircuit(n*2)
    # Do copy; |x>|0> -> |x>|x>
    for q in range(n):
        qc.cx(q, q+n)
    if '1' not in b: 
        return qc  # 1:1 mapping, so just exit
    i = b.find('1') # index of first non-zero bit in b
    # Do |x> -> |s.x> on condition that q_i is 1
    for q in range(n):
        if b[q] == '1':
            qc.cx(i, (q)+n)
    return qc 


def unitary2latex(unitary, precision=5, pretext="", display_output=True):
    "replace with array_to_latex"
    out_latex = "\n$$ " + pretext
    out_latex += "\\begin{bmatrix}\n"
    for row in unitary:
        out_latex += "\t" # This makes the latex source more readable
        for amplitude in row:
            amplitude = np.real_if_close(amplitude)
            amp_mod = np.mod(np.real(amplitude), 1)
            if (np.isclose(amp_mod, 0) or np.isclose(amp_mod, 1)) and np.isclose(np.imag(amplitude), 0):
                out_latex += str(int(np.round(amplitude))) + " & "
            else:
                out_latex += '{:.{}f}'.format(amplitude, precision) + " & "
        out_latex = out_latex[:-2] # remove trailing ampersands
        out_latex += " \\\\\n"
    out_latex += "\end{bmatrix} $$"
    if display_output:
        display(Math(out_latex))
    else:
        return out_latex


def random_state(nqubits):
    """Creates a random nqubit state vector"""
    from numpy import append, array, sqrt
    from numpy.random import random
    real_parts = array([])
    im_parts = array([])
    for amplitude in range(2**nqubits):
        real_parts = append(real_parts, (random()*2)-1)
        im_parts = append(im_parts, (random()*2)-1)
    # Combine into list of complex numbers:
    amps = real_parts + 1j*im_parts
    # Normalise
    magnitude_squared = 0
    for a in amps:
        magnitude_squared += abs(a)**2
    amps /= sqrt(magnitude_squared)
    return amps


# +
def num_to_latex(num, precision=5):
    """Takes a complex number as input and returns a latex representation
    
        Args:
            num (numerical): The number to be converted to latex.
            precision (int): If the real or imaginary parts of num are not close
                             to an integer, the number of decimal places to round to
        
        Returns:
            str: Latex representation of num
    """
    r = np.real(num)
    i = np.imag(num)
    common_factor = None
    
    # try to factor out common terms in imaginary numbers
    if np.isclose(abs(r), abs(i)) and not np.isclose(r, 0):
        common_factor = abs(r)
        r = r/common_factor
        i = i/common_factor
    
    common_terms = {
        1/math.sqrt(2): '\\tfrac{1}{\\sqrt{2}}',
        1/math.sqrt(3): '\\tfrac{1}{\\sqrt{3}}',
        math.sqrt(2/3): '\\sqrt{\\tfrac{2}{3}}',
        math.sqrt(3/4): '\\sqrt{\\tfrac{3}{4}}',
        1/math.sqrt(8): '\\tfrac{1}{\\sqrt{8}}'
    }
    def proc_value(val):
        # See if val is close to an integer
        val_mod = np.mod(val, 1)
        if (np.isclose(val_mod, 0) or np.isclose(val_mod, 1)):
            # If so, return that integer
            return str(int(np.round(val)))
        # Otherwise, see if it matches one of the common terms
        for term, latex_str in common_terms.items():
             if np.isclose(abs(val), term):
                    if val > 0:
                        return latex_str
                    else:
                        return "-" + latex_str
        # try to factorise val nicely
        frac = Fraction(val).limit_denominator()
        num, denom = frac.numerator, frac.denominator
        if num + denom < 20:
            if val > 0:
                return ("\\tfrac{%i}{%i}" % (abs(num), abs(denom)))
            else:
                return ("-\\tfrac{%i}{%i}" % (abs(num), abs(denom)))
        else:
            # Failing everything else, return val as a decimal
            return "{:.{}f}".format(val, precision).rstrip("0")
    
    if common_factor != None:
        common_facstring = proc_value(common_factor)
    else:
        common_facstring = None
    realstring = proc_value(r)
    if i > 0:
        operation = "+"
        imagstring = proc_value(i)
    else:
        operation = "-"
        imagstring = proc_value(-i)
    if imagstring == "1":
        imagstring = ""
    if imagstring == "0":
        return realstring
    if realstring == "0":
        if operation == "-":
            return "-{}i".format(imagstring)
        else:
            return "{}i".format(imagstring)
    if common_facstring != None:
        return "{}({} {} {}i)".format(common_facstring, realstring, operation, imagstring)
    else:
        return "{} {} {}i".format(realstring, operation, imagstring)

def vector_to_latex(vector, precision=5, pretext=""):
    """Latex representation of a complex numpy array (with dimension 1)

        Args:
            vector (ndarray): The vector to be converted to latex, must have dimension 1.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
        
        Returns:
            str: Latex representation of the vector
    """
    out_string = "$$\n{}".format(pretext)
    out_string += "\\begin{bmatrix}\n"
    for amplitude in vector:
        num_string = num_to_latex(amplitude, precision=precision)
        out_string += num_string + " \\\\\n"
    if len(vector) != 0:
        out_string = out_string[:-4] + "\n" # remove trailing characters
    out_string += "\end{bmatrix}\n"
    return out_string

def matrix_to_latex(matrix, precision=5, pretext=""):
    """Latex representation of a complex numpy array (with dimension 2)
    
        Args:
            matrix (ndarray): The matrix to be converted to latex, must have dimension 2.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
        
        Returns:
            str: Latex representation of the matrix
    """
    out_string = "$$\n{}".format(pretext)
    out_string += "\\begin{bmatrix}\n"
    for row in matrix:
        for amplitude in row:
            num_string = num_to_latex(amplitude, precision=precision)
            out_string += num_string + " & "
        out_string = out_string[:-2] # remove trailing ampersands
        out_string += " \\\\\n"
    out_string += "\end{bmatrix}\n$$\n"
    return out_string

def array_to_latex(array, precision=5, pretext="", display_output=True):
    """Latex representation of a complex numpy array (with dimension 1 or 2)
    
        Args:
            matrix (ndarray): The array to be converted to latex, must have dimension 1 or 2.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
            display_output: (bool) if True, uses IPython.display to display output, otherwise returns the latex string.
        
        Returns:
            str: Latex representation of the array, wrapped in $$
        
        Raises:
            ValueError: If array can not be interpreted as a numerical numpy array
            ValueError: If the dimension of array is not 1 or 2
    """
    try:
        array = np.asarray(array)
        array+1 # Test array contains numerical data
    except:
        raise ValueError("array_to_latex can only convert numpy arrays containing numerical data, or types that can be converted to such arrays")
    if array.ndim == 1:
        output = vector_to_latex(array, precision=precision, pretext=pretext)
    elif array.ndim == 2:
        output = matrix_to_latex(array, precision=precision, pretext=pretext)
    else:
        raise ValueError("array_to_latex can only convert numpy ndarrays of dimension 1 or 2")
    if display_output:
        display(Math(output))
    else:
        return(output)
