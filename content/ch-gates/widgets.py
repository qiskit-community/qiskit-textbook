from IPython.display import display, Markdown, Latex
import numpy as np

def Vector2Latex(vector, precision=5, pretext="", display_output=True):
    out_latex = "\n$$ " + pretext
    out_latex += "\\begin{bmatrix}\n"
    for amplitude in vector:
        amplitude = np.real_if_close(amplitude)
        amp_mod = np.mod(amplitude, 1)
        if (np.isclose(amp_mod, 0) or np.isclose(amp_mod, 1)) and type(amplitude) == np.ndarray:
            out_latex += str(int(np.round(amplitude))) + " \\\\\n"
        else:
            out_latex += '{:.{}f}'.format(amplitude, precision) + " \\\\\n"
    out_latex = out_latex[:-4] # remove trailing ampersands
    out_latex += "\end{bmatrix} $$"
    if display_output:
        display(Markdown(out_latex))
    else:
        return out_latex

def Unitary2Latex(unitary, precision=5, pretext="", display_output=True):
    out_latex = "\n$$ " + pretext
    out_latex += "\\begin{bmatrix}\n"
    for row in unitary:
        out_latex += "\t" # This makes the latex source more readable
        for amplitude in row:
            amplitude = np.real_if_close(amplitude)
            amp_mod = np.mod(amplitude, 1)
            if (np.isclose(amp_mod, 0) or np.isclose(amp_mod, 1)) and type(amplitude) == np.ndarray:
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
