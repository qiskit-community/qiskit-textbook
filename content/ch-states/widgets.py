import ipywidgets as widgets
from IPython.display import display, clear_output
from qiskit.visualization import plot_bloch_vector
from numpy import sqrt, cos, sin, pi

class _pre():

    def __init__(self, value=''):
        self.widget = widgets.HTML()
        self.value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        self.widget.value = '<pre>{}</pre>'.format(value)


class _img():

    def __init__(self, value=None):
        self.widget = widgets.Image(format='png')
        self.value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        if value is None:
            return

        data = BytesIO()
        value.savefig(data, format='png')
        data.seek(0)
        self.widget.value = data.read()


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
            state_vector = eval(text_input.value)
            c1, c2 = state_vector[0], state_vector[1]
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
    data = BytesIO()
    image = _img(value=plot_bloch_vector([0, 0, 1]))
    def on_button_click(b):
        from math import pi, sqrt
        try:
            theta = eval(theta_input.value)
            phi = eval(phi_input.value)
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


def gate_demo(gates='full'):
    from qiskit import QuantumCircuit, execute, Aer
    from qiskit.visualization import plot_bloch_multivector
    gate_list = []
    showing_rz = False
    if 'pauli' in gates:
        gate_list += ['X','Y','Z']
    if '+h' in gates:
        gate_list.append('H')
    if '+rz' in gates:
        showing_rz = True
    if gate_list == [] or gates == 'full':
        gate_list = ['I','X','Y','Z','H','S','Sdg','T','Tdg']
        showing_rz = True

    backend = Aer.get_backend('statevector_simulator')
    qc = QuantumCircuit(1)
    button_list = [widgets.Button(description=gate, layout=widgets.Layout(width='3em', height='3em')) for gate in gate_list]
    button_list.append(widgets.Button(description='Reset', layout=widgets.Layout(width='6em', height='3em')))
    image = _img()
    def update_output():
        out_state = execute(qc,backend).result().get_statevector()
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
        elif b.description == 'Rz':
                qc.rz(zrot_slider.value,0)
        else:
            functionmap[b.description](0)

    def on_button_click(b):
        apply_gates(b,qc)
        update_output()

    for button in button_list:
        button.on_click(on_button_click)
    if showing_rz:
        rz_button = widgets.Button(description='Rz', layout=widgets.Layout(width='3em', height='3em'))
        rz_button.on_click(on_button_click)
        zrot_slider = widgets.FloatSlider(value=pi,
                                         min= -pi,
                                         max= pi,
                                         disabled=False,
                                         readout_format='.2f')
    qc = QuantumCircuit(1)
    update_output()

    if showing_rz:
        top_box = widgets.HBox(button_list)
        bottom_box = widgets.HBox([rz_button, zrot_slider])
        main_box = widgets.VBox([top_box, bottom_box])
    else:
        main_box = widgets.HBox(button_list)

    display(main_box)
    display(image.widget)



