#!/usr/bin/env python3 
# -*- coding: utf-8 -*-
import ipywidgets as widgets
from IPython.display import display, clear_output, Math
from qiskit.visualization import plot_bloch_vector
from numpy import sqrt, cos, sin, pi
import numexpr
import re

from qiskit_textbook.widgets._helpers import _pre, _img

def binary_widget(nbits=5):
    nbits = max(min(10, nbits), 2) # Keep nbits between 2 and 10

    output = _pre()
    bits = ['0' for i in range(nbits)]
    button_list = [widgets.ToggleButton(description=str(2**i),
                                        layout=widgets.Layout(width='3em',height='3em'))
                   for i in reversed(range(nbits))]

    hbox = widgets.HBox(button_list)
    label1 = widgets.Label(value="Toggle the bits below to change the binary number.")
    label2 = widgets.Label(value="Think of a number between 0 and %i and try to write it down in binary." % ((2**nbits)-1))
    vbox = widgets.VBox([label1,label2,hbox])
    def on_btn_click(b):
        for b in range(nbits):
            if button_list[b].value:
                bits[b] = '1'
            else:
                bits[b] = '0'
        string = "".join(bits)
        output.value = "Binary" + " "*(nbits//2) + " Decimal\n " + string + " = " + str(int(string,2))

    for button in button_list: button.observe(on_btn_click)

    # Add output before button press
    string = "".join(bits)
    output.value = "Binary" + " "*(nbits//2) + " Decimal\n " + string + " = " + str(int(string,2))

    display(vbox)
    display(output.widget)


def state_vector_exercise(target):
    output = _pre()
    button = widgets.Button(description="Check", layout=widgets.Layout(width='5em'))
    text_input = widgets.Text(value='[1, 0]',
                              placeholder='Type something',
                              width='50px',
                              disabled=False)

    label = widgets.Label(value="State Vector:")

    def on_button_click(b):
        try:
            state_vector = text_input.value.strip("[]").replace(" ", "").split(",")
            c1, c2 = numexpr.evaluate(state_vector[0]), numexpr.evaluate(state_vector[1])
        except Exception as e:
            output.value = str(e).split("(")[0]
            return

        squared_magnitude = abs(c1)**2 + abs(c2)**2
        p = abs(c1)**2
        if not (squared_magnitude < 1.01 and squared_magnitude > .99): # Close Enough
            output.value = "Magnitude is not equal to 1"
            return
        elif p > target*0.99 and p < target*1.01:
            output.value = "Correct!"
        else:
            output.value = "The absolute value of " + str(c1) + ", squared is not equal to " + str(target)

    hbox = widgets.HBox([text_input, button])
    vbox = widgets.VBox([label, hbox])
    button.on_click(on_button_click)

    display(vbox)
    display(output.widget)


def bloch_calc():
    output = _pre()
    button = widgets.Button(description="Plot", layout=widgets.Layout(width='4em'))
    theta_input = widgets.Text(label='$\\theta$',
                               placeholder='Theta',
                               disabled=False)
    phi_input = widgets.Text(label='$\phi$',
                             placeholder='Phi',
                             disabled=False)

    label = widgets.Label(value="Define a qubit state using $\\theta$ and $\phi$:")
    image = _img(value=plot_bloch_vector([0, 0, 1]))
    def on_button_click(b):
        from math import pi, sqrt
        try:
            theta = numexpr.evaluate(theta_input.value)
            phi = numexpr.evaluate(phi_input.value)
        except Exception as e:
            output.value = "Error: " + str(e)
            return
        x = sin(theta)*cos(phi)
        y = sin(theta)*sin(phi)
        z = cos(theta)
        # Remove horrible almost-zero results
        if abs(x) < 0.0001:
            x = 0
        if abs(y) < 0.0001:
            y = 0
        if abs(z) < 0.0001:
            z = 0
        output.value = "x = r * sin(" + theta_input.value + ") * cos(" + phi_input.value + ")\n"
        output.value += "y = r * sin(" + theta_input.value + ") * sin(" + phi_input.value + ")\n"
        output.value += "z = r * cos(" + theta_input.value + ")\n\n"
        output.value += "Cartesian Bloch Vector = [" + str(x) + ", " + str(y) + ", " + str(z) + "]"
        image.value = plot_bloch_vector([x,y,z])

    hbox = widgets.HBox([phi_input, button])
    vbox = widgets.VBox([label, theta_input, hbox])
    button.on_click(on_button_click)
    display(vbox)
    display(output.widget)
    display(image.widget)


def plot_bloch_vector_spherical(coords):
    clear_output()
    theta, phi, r = coords[0], coords[1], coords[2]
    x = r*sin(theta)*cos(phi)
    y = r*sin(theta)*sin(phi)
    z = r*cos(theta)
    output = widgets.Output()
    return plot_bloch_vector([x,y,z])


def scalable_circuit(func):
    """Makes a scalable circuit interactive. Function must take 
    qc (QuantumCircuit) and number of qubits (int) as positional inputs"""
    from qiskit import QuantumCircuit
    def interactive_function(n):
        qc = QuantumCircuit(n)
        func(qc, n)
        return qc.draw('mpl')
    
    from ipywidgets import IntSlider
    # Ideally this would use `interact` from ipywidgets but this is
    # incompatible with thebe lab
    image = _img()
    n_slider = IntSlider(min=1,max=8,step=1,value=4)
    image.value = interactive_function(n_slider.value)
    def update_output(b):
        image.value = interactive_function(n_slider.value)
    n_slider.observe(update_output)
    display(n_slider)
    display(image.widget)


def gate_demo(gates='full', qsphere=False):
    from qiskit import QuantumCircuit, execute, Aer
    from qiskit.visualization import plot_bloch_multivector, plot_state_qsphere
    gate_list = []
    showing_p = False
    gates = gates.split('+')
    if 'pauli' in gates:
        gate_list += ['X','Y','Z']
    if 'h' in gates:
        gate_list.append('H')
    if 'p' in gates:
        showing_p = True
    if gate_list == [] or gates == 'full':
        gate_list = ['I','X','Y','Z','H','S','Sdg','T','Tdg']
        showing_p = True

    backend = Aer.get_backend('statevector_simulator')
    qc = QuantumCircuit(1)
    button_list = [widgets.Button(description=gate, layout=widgets.Layout(width='3em', height='3em')) for gate in gate_list]
    button_list.append(widgets.Button(description='Reset', layout=widgets.Layout(width='6em', height='3em')))
    image = _img()
    def update_output():
        out_state = execute(qc,backend).result().get_statevector()
        if qsphere: 
            image.value = plot_state_qsphere(out_state)
        else:
            image.value = plot_bloch_multivector(out_state)

    def apply_gates(b,qc):
        functionmap = {
            'X':qc.x,
            'Y':qc.y,
            'Z':qc.z,
            'H':qc.h,
            'S':qc.s,
            'T':qc.t,
            'Sdg':qc.sdg,
            'Tdg':qc.tdg,
        }
        if b.description == 'I':
            pass
        elif b.description == 'Reset':
            qc.data = []
        elif b.description == 'P':
                qc.p(zrot_slider.value,0)
        else:
            functionmap[b.description](0)

    def on_button_click(b):
        apply_gates(b,qc)
        update_output()

    for button in button_list:
        button.on_click(on_button_click)
    if showing_p:
        p_button = widgets.Button(description='P', layout=widgets.Layout(width='3em', height='3em'))
        p_button.on_click(on_button_click)
        zrot_slider = widgets.FloatSlider(value=pi,
                                         min= -pi,
                                         max= pi,
                                         disabled=False,
                                         readout_format='.2f')
    qc = QuantumCircuit(1)
    update_output()

    if showing_p:
        top_box = widgets.HBox(button_list)
        bottom_box = widgets.HBox([p_button, zrot_slider])
        main_box = widgets.VBox([top_box, bottom_box])
    else:
        main_box = widgets.HBox(button_list)

    display(main_box)
    display(image.widget)


def bv_widget(nqubits, hidden_string, display_ancilla=False, hide_oracle=True):
    if nqubits < 1:
        print("nqubits must be 1 or greater, setting to 1.")
        nqubits = 1
    if nqubits < len(hidden_string):
        difference = len(hidden_string) - nqubits
        hidden_string = hidden_string[difference:]
        print("Error: s is too long, trimming the first %i bits and using '%s' instead." % (difference, hidden_string))
    import numpy as np
    from qiskit_textbook.tools import num_to_latex, array_to_latex
    from qiskit import QuantumCircuit, Aer, execute
    backend = Aer.get_backend('statevector_simulator')
    nqubits += 1
    if hide_oracle:
        oracle_qc = QuantumCircuit(nqubits)
        q = 0
        for char in hidden_string:
            if char == "1":
                oracle_qc.cx(q,nqubits-1)
            q += 1
        oracle_gate = oracle_qc.to_gate()
    qc = QuantumCircuit(nqubits)
    qc.h(nqubits-1)
    qc.z(nqubits-1)
    class Message():
        def __init__(self):
            if display_ancilla:
                self.ops = "|{-}\\rangle\\otimes|" + "0"*(nqubits-1) + "\\rangle"
                self.vec = "|{-}\\rangle\\otimes|" + "0"*(nqubits-1) + "\\rangle"
            else:
                self.ops = "|" + "0"*(nqubits-1) + "\\rangle"
                self.vec = "|" + "0"*(nqubits-1) + "\\rangle"
    
    msg = Message()
    def vec_in_braket(vec, nqubits):
        scalfac = ""
        tensorfac = ""
        state = ""
        # Factor out separable 'output' qubit if possible
        if nqubits > 1:
            vfirst = vec[:2**nqubits//2]
            vlast = vec[2**nqubits//2:]
            if np.allclose(vfirst, 0):
                vec = vlast
                tensorfac += "|1\\rangle"
                nqubits -= 1
            elif np.allclose(vlast, 0):
                vec = vfirst
                tensorfac += "|0\\rangle"
                nqubits -= 1
            elif np.allclose(vfirst, vlast):
                vec = vfirst*np.sqrt(2)
                tensorfac += "|{+}\\rangle"
                nqubits -= 1
            elif np.allclose(vfirst, -vlast):
                vec = vfirst*np.sqrt(2)
                tensorfac += "|{-}\\rangle"
                nqubits -= 1

        if np.allclose(np.abs(vec), np.abs(vec[0])):
            scalfac = num_to_latex(vec[0])
            vec = vec/vec[0]

        for i in range(len(vec)):
            if not np.isclose(vec[i], 0):
                basis = format(i, 'b').zfill(nqubits)
                if not np.isclose(vec[i], 1):
                    if np.isclose(vec[i], -1):
                        if state.endswith("+ "):
                            state = state[:-2]
                        state += "-"
                    else:
                        state += num_to_latex(vec[i])
                state += "|" + basis +"\\rangle + "
        state = state.replace("j", "i")
        state = state[:-2]
        if len(state) > 5000:
            return "\\text{(Too large to display)}"
        if scalfac != "" or (tensorfac != "" and len(state)>(9+nqubits) and display_ancilla):
            state = ("(%s)" % state)
        if scalfac != "":
            state = scalfac + state
        if tensorfac != "" and display_ancilla:
            state =  tensorfac + "\otimes" + state
        return state


    def hadamards(qc, nqubits):
        for q in range(nqubits-1):
            qc.h(q)

    def oracle(qc, nqubits):
        if hide_oracle:
            qc.append(oracle_gate, range(nqubits))
        else:
            qc.barrier()
            q = 0
            for char in hidden_string:
                if char == "1":
                    qc.cx(q,nqubits-1)
                q += 1
            qc.barrier()
    
    def update_output():
        statevec = execute(qc, backend).result().get_statevector()
        msg.vec = vec_in_braket(statevec, nqubits)
        html_math.value = "$$ %s = %s $$" % (msg.ops, msg.vec)
        image.value = qc.draw('mpl')
    
    def on_hads_click(b):
        hadamards(qc, nqubits)
        if display_ancilla:
            msg.ops = "|{-}\\rangle\\otimes H^{\\otimes n}" + msg.ops[18:]
        else:
            msg.ops = "H^{\\otimes n}" + msg.ops            
        update_output()
    def on_oracle_click(b):
        oracle(qc, nqubits)
        if display_ancilla:
            msg.ops = "|{-}\\rangle\\otimes U_f" + msg.ops[18:]
        else:
            msg.ops = "U_f" + msg.ops
        update_output()
    
    def on_clear_click(b):
        for i in range(len(qc.data)-2):
            qc.data.pop()
        msg.__init__()
        update_output()
    
    hads_btn = widgets.Button(description="H⊗ⁿ")
    hads_btn.on_click(on_hads_click)
    oracle_btn = widgets.Button(description="Oracle")
    oracle_btn.on_click(on_oracle_click)
    clear_btn = widgets.Button(description="Clear")
    clear_btn.on_click(on_clear_click)
        
    hbox = widgets.HBox([hads_btn, oracle_btn, clear_btn])
    html_math = widgets.HTMLMath()
    html_math.value = "$$ %s = %s $$" % (msg.ops, msg.vec)
    image = _img()
    image.value = qc.draw('mpl')
    display(hbox, html_math, image.widget)


def dj_widget(size="small", case="balanced", display_ancilla=False, hide_oracle=True):
    size, case = size.lower(), case.lower()
    if case not in ["balanced", "constant"]:
        print("Error: `case` must be 'balanced' or 'constant'")
        return
    if size not in ["small", "large"]:
        print("Error: `size` must be 'small' or 'large'")
        return
    import numpy as np
    import random
    from qiskit_textbook.tools import num_to_latex, array_to_latex
    from qiskit_textbook.problems import dj_problem_oracle
    from qiskit import QuantumCircuit, Aer, execute
    if case == 'balanced':
        problem = random.choice([1,3,4])
    else:
        problem = 2
    backend = Aer.get_backend('statevector_simulator')
    if size == "small":
        oracle = QuantumCircuit(3)
        if case == "balanced":
            if problem == 1:
                oracle.cx(0,2)
                oracle.cx(1,2)
            elif problem == 3:
                oracle.cx(0,2)
            elif problem == 4:
                oracle.ccx(0,1,2)
                oracle.x(0)
                oracle.x(1)
                oracle.ccx(0,1,2)
                oracle.x(0)
                oracle.x(1)
        else:
            oracle.i(2)
    else:
        oracle = dj_problem_oracle(problem, to_gate=False)
    if hide_oracle:
        oracle = oracle.to_gate()
    if size == "small":
        nqubits = 3
    else:
        nqubits = 5
    qc = QuantumCircuit(nqubits)
    qc.h(nqubits-1)
    qc.z(nqubits-1)
    class Message():
        def __init__(self):
            if display_ancilla:
                self.ops = "|{-}\\rangle\\otimes|" + "0"*(nqubits-1) + "\\rangle"
                self.vec = "|{-}\\rangle\\otimes|" + "0"*(nqubits-1) + "\\rangle"
            else:
                self.ops = "|" + "0"*(nqubits-1) + "\\rangle"
                self.vec = "|" + "0"*(nqubits-1) + "\\rangle"
    
    msg = Message()
    def vec_in_braket(vec, nqubits):
        scalfac = ""
        tensorfac = ""
        state = ""
        # Factor out separable 'output' qubit if possible
        if nqubits > 1:
            vfirst = vec[:2**nqubits//2]
            vlast = vec[2**nqubits//2:]
            if np.allclose(vfirst, 0):
                vec = vlast
                tensorfac += "|1\\rangle"
                nqubits -= 1
            elif np.allclose(vlast, 0):
                vec = vfirst
                tensorfac += "|0\\rangle"
                nqubits -= 1
            elif np.allclose(vfirst, vlast):
                vec = vfirst*np.sqrt(2)
                tensorfac += "|{+}\\rangle"
                nqubits -= 1
            elif np.allclose(vfirst, -vlast):
                vec = vfirst*np.sqrt(2)
                tensorfac += "|{-}\\rangle"
                nqubits -= 1

        if np.allclose(np.abs(vec), np.abs(vec[0])):
            scalfac = num_to_latex(vec[0])
            vec = vec/vec[0]

        for i in range(len(vec)):
            if not np.isclose(vec[i], 0):
                basis = format(i, 'b').zfill(nqubits)
                if not np.isclose(vec[i], 1):
                    if np.isclose(vec[i], -1):
                        if state.endswith("+ "):
                            state = state[:-2]
                        state += "-"
                    else:
                        state += num_to_latex(vec[i])
                state += "|" + basis +"\\rangle + "
        state = state.replace("j", "i")
        state = state[:-2]
        if len(state) > 5000:
            return "\\text{(Too large to display)}"
        if scalfac != "" or (tensorfac != "" and len(state)>(9+nqubits) and display_ancilla):
            state = ("(%s)" % state)
        if scalfac != "":
            state = scalfac + state
        if tensorfac != "" and display_ancilla:
            state =  tensorfac + "\otimes" + state
        return state


    def hadamards(qc, nqubits):
        for q in range(nqubits-1):
            qc.h(q)

    def apply_oracle(qc, nqubits):
        if hide_oracle:
            qc.append(oracle, range(nqubits))
        else:
            qc.barrier()
            qc += oracle
            qc.barrier()
    
    def update_output():
        statevec = execute(qc, backend).result().get_statevector()
        msg.vec = vec_in_braket(statevec, nqubits)
        html_math.value = "$$ %s = %s $$" % (msg.ops, msg.vec)
        image.value = qc.draw('mpl')
    
    def on_hads_click(b):
        hadamards(qc, nqubits)
        if display_ancilla:
            msg.ops = "|{-}\\rangle\\otimes H^{\\otimes n}" + msg.ops[18:]
        else:
            msg.ops = "H^{\\otimes n}" + msg.ops            
        update_output()
    def on_oracle_click(b):
        apply_oracle(qc, nqubits)
        if display_ancilla:
            msg.ops = "|{-}\\rangle\\otimes U_f" + msg.ops[18:]
        else:
            msg.ops = "U_f" + msg.ops
        update_output()
    
    def on_clear_click(b):
        for i in range(len(qc.data)-2):
            qc.data.pop()
        msg.__init__()
        update_output()
    
    hads_btn = widgets.Button(description="H⊗ⁿ")
    hads_btn.on_click(on_hads_click)
    oracle_btn = widgets.Button(description="Oracle")
    oracle_btn.on_click(on_oracle_click)
    clear_btn = widgets.Button(description="Clear")
    clear_btn.on_click(on_clear_click)
        
    hbox = widgets.HBox([hads_btn, oracle_btn, clear_btn])
    html_math = widgets.HTMLMath()
    html_math.value = "$$ %s = %s $$" % (msg.ops, msg.vec)
    image = _img()
    image.value = qc.draw('mpl')
    display(hbox, html_math, image.widget)


