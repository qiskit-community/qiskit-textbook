import numpy as np
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
    
    def proc_value(val):
        # See if val is close to an integer
        val_mod = np.mod(val, 1)
        if (np.isclose(val_mod, 0) or np.isclose(val_mod, 1)):
            # If so, return that integer
            return str(int(np.round(val)))
        else:
            # Otherwise return val as a decimal
            return "{:.{}f}".format(val, precision).rstrip("0")
    
    realstring = proc_value(r)
    imagstring = proc_value(i)
    if imagstring == "0":
        return realstring
    if realstring == "0":
        return imagstring + "i"
    else:
        return "{} + {}i".format(realstring, outstring)

def vector_to_latex(vector, precision=5, pretext=""):
    """Latex representation of a complex numpy array (with dimension 1)

        Args:
            vector (ndarray): The vector to be converted to latex, must have dimension 1.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
        
        Returns:
            str: Latex representation of the vector, wrapped in $$
    """
    out_string = "\n$$\n{}\n".format(pretext)
    out_string += "\\begin{bmatrix}\n"
    for amplitude in vector:
        num_string = num_to_latex(amplitude, precision=precision)
        out_string += num_string + " \\\\\n"
    if len(vector) != 0:
        out_string = out_string[:-4] + "\n"# remove trailing characters
    out_string += "\end{bmatrix}\n$$"
    return out_string

def matrix_to_latex(matrix, precision=5, pretext=""):
    """Latex representation of a complex numpy array (with dimension 2)
    
        Args:
            matrix (ndarray): The matrix to be converted to latex, must have dimension 2.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
        
        Returns:
            str: Latex representation of the matrix, wrapped in $$
    """
    out_string = "\n$$\n{}\n".format(pretext)
    out_string += "\\begin{bmatrix}\n"
    for row in matrix:
        for amplitude in row:
            num_string = num_to_latex(amplitude, precision=precision)
            out_string += num_string + " & "
        out_string = out_string[:-2] # remove trailing ampersands
        out_string += " \\\\\n"
    out_string += "\end{bmatrix}\n$$"
    return out_string

def array_to_latex(array, precision=5, pretext=""):
    """Latex representation of a complex numpy array (with dimension 1 or 2)
    
        Args:
            matrix (ndarray): The array to be converted to latex, must have dimension 1 or 2.
            precision: (int) For numbers not close to integers, the number of decimal places to round to.
            pretext: (str) Latex string to be prepended to the latex, intended for labels.
        
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
        return vector_to_latex(array, precision=precision, pretext=pretext)
    elif array.ndim == 2:
        return matrix_to_latex(array, precision=precision, pretext=pretext)
    else:
        raise ValueError("array_to_latex can only convert numpy ndarrays of dimension 1 or 2")
