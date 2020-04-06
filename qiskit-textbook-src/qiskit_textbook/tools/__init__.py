#!/usr/bin/env python3

from IPython.display import display, Markdown, Latex
import numpy as np

def vector2latex(vector, precision=5, pretext="", display_output=True):
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
        display(Markdown(out_latex))
    else:
        return out_latex

def unitary2latex(unitary, precision=5, pretext="", display_output=True):
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
        display(Markdown(out_latex))
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
