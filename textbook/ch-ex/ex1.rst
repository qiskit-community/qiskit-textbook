.. raw:: html

   <!-- #region {"colab_type": "text", "id": "ccfRql22_IBL"} -->

Classical Logic Gates with Quantum Circuits
===========================================

.. raw:: html

   <!-- #endregion -->

.. code:: python

   from qiskit import *
   from qiskit.tools.visualization import plot_histogram
   import numpy as np

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "ccfRql22_IBL"} -->

Using the NOT gate (expressed as ``x`` in Qiskit), the CNOT gate
(expressed as ``cx`` in Qiskit) and the Toffoli gate (expressed as
``ccx`` in Qiskit) create functions to implement the XOR, AND, NAND and
OR gates.

An implementation of the NOT gate is provided as an example.

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "OKCkpBD0_c6L"} -->

NOT gate
--------

.. raw:: html

   <!-- #endregion -->

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "OKCkpBD0_c6L"} -->

This function takes a binary string input (``'0'`` or ``'1'``) and
returns the opposite binary output’.

\```python colab={} colab_type=“code” id=“6JPMpemG_RMb” def NOT(input):

::

   q = QuantumRegister(1) # a qubit in which to encode and manipulate the input
   c = ClassicalRegister(1) # a bit to store the output
   qc = QuantumCircuit(q, c) # this is where the quantum program goes

   # We encode '0' as the qubit state |0⟩, and '1' as |1⟩
   # Since the qubit is initially |0⟩, we don't need to do anything for an input of '0'
   # For an input of '1', we do an x to rotate the |0⟩ to |1⟩
   if input=='1':
       qc.x( q[0] )
       
   # Now we've encoded the input, we can do a NOT on it using x
   qc.x( q[0] )

   # Finally, we extract the |0⟩/|1⟩ output of the qubit and encode it in the bit c[0]
   qc.measure( q[0], c[0] )

   # We'll run the program on a simulator
   backend = Aer.get_backend('qasm_simulator')
   # Since the output will be deterministic, we can use just a single shot to get it
   job = execute(qc,backend,shots=1)
   output = next(iter(job.result().get_counts()))

   return output

::


   <!-- #region {"colab_type": "text", "id": "Gd-9DEAaAarK"} -->
   ## XOR gate
   <!-- #endregion -->

   <!-- #region {"colab_type": "text", "id": "Gd-9DEAaAarK"} -->
   Takes two binary strings as input and gives one as output.

   The output is `'0'` when the inputs are equal and  `'1'` otherwise.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="oPVCyyaHAays"
   def XOR(input1,input2):
       
       q = QuantumRegister(2) # two qubits in which to encode and manipulate the input
       c = ClassicalRegister(1) # a bit to store the output
       qc = QuantumCircuit(q, c) # this is where the quantum program goes
       
       # YOUR QUANTUM PROGRAM GOES HERE    
       qc.measure(q[1],c[0]) # YOU CAN CHANGE THIS IF YOU WANT TO
       
       # We'll run the program on a simulator
       backend = Aer.get_backend('qasm_simulator')
       # Since the output will be deterministic, we can use just a single shot to get it
       job = execute(qc,backend,shots=1,memory=True)
       output = job.result().get_memory()[0]
       
       return output

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "dPMfIpfYAAT7"} -->

AND gate
--------

.. raw:: html

   <!-- #endregion -->

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "dPMfIpfYAAT7"} -->

Takes two binary strings as input and gives one as output.

The output is ``'1'`` only when both the inputs are ``'1'``.

\```python colab={} colab_type=“code” id=“HdYfpnslAAeJ” def
AND(input1,input2):

::

   q = QuantumRegister(3) # two qubits in which to encode the input, and one for the output
   c = ClassicalRegister(1) # a bit to store the output
   qc = QuantumCircuit(q, c) # this is where the quantum program goes

   # YOUR QUANTUM PROGRAM GOES HERE
   qc.measure(q[2],c[0]) # YOU CAN CHANGE THIS IF YOU WANT TO

   # We'll run the program on a simulator
   backend = Aer.get_backend('qasm_simulator')
   # Since the output will be deterministic, we can use just a single shot to get it
   job = execute(qc,backend,shots=1,memory=True)
   output = job.result().get_memory()[0]

   return output

::


   <!-- #region {"colab_type": "text", "id": "OXfchiSyAAoo"} -->
   ## NAND gate
   <!-- #endregion -->

   <!-- #region {"colab_type": "text", "id": "OXfchiSyAAoo"} -->
   Takes two binary strings as input and gives one as output.

   The output is `'0'` only when both the inputs are `'1'`.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="nJhmG115AAwv"
   def NAND(input1,input2):
     
       q = QuantumRegister(3) # two qubits in which to encode the input, and one for the output
       c = ClassicalRegister(1) # a bit to store the output
       qc = QuantumCircuit(q, c) # this is where the quantum program goes
       
       # YOUR QUANTUM PROGRAM GOES HERE
       qc.measure(q[2],c[0]) # YOU CAN CHANGE THIS IF YOU WANT TO
       
       # We'll run the program on a simulator
       backend = Aer.get_backend('qasm_simulator')
       # Since the output will be deterministic, we can use just a single shot to get it
       job = execute(qc,backend,shots=1,memory=True)
       output = job.result().get_memory()[0]
       
       return output

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "n1KswU_jABFA"} -->

OR gate
-------

.. raw:: html

   <!-- #endregion -->

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "n1KswU_jABFA"} -->

Takes two binary strings as input and gives one as output.

The output is ``'1'`` if either input is ``'1'``.

\```python colab={} colab_type=“code” id="_gofB196ABMj" def
OR(input1,input2):

::

   q = QuantumRegister(3) # two qubits in which to encode the input, and one for the output
   c = ClassicalRegister(1) # a bit to store the output
   qc = QuantumCircuit(q, c) # this is where the quantum program goes

   # YOUR QUANTUM PROGRAM GOES HERE
   qc.measure(q[2],c[0]) # YOU CAN CHANGE THIS IF YOU WANT TO

   # We'll run the program on a simulator
   backend = Aer.get_backend('qasm_simulator')
   # Since the output will be deterministic, we can use just a single shot to get it
   job = execute(qc,backend,shots=1,memory=True)
   output = job.result().get_memory()[0]

   return output

::


   <!-- #region {"colab_type": "text", "id": "flbXaXrY_pNz"} -->
   ## Tests
   <!-- #endregion -->

   <!-- #region {"colab_type": "text", "id": "flbXaXrY_pNz"} -->
   The following code runs the functions above for all possible inputs, so that you can check whether they work.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="S9hyGAZ9_VQc"
   print('\nResults for the NOT gate')
   for input in ['0','1']:
       print('    Input',input,'gives output',NOT(input))
       
   print('\nResults for the XOR gate')
   for input1 in ['0','1']:
       for input2 in ['0','1']:
           print('    Inputs',input1,input2,'give output',XOR(input1,input2))

   print('\nResults for the AND gate')
   for input1 in ['0','1']:
       for input2 in ['0','1']:
           print('    Inputs',input1,input2,'give output',AND(input1,input2))

   print('\nResults for the NAND gate')
   for input1 in ['0','1']:
       for input2 in ['0','1']:
           print('    Inputs',input1,input2,'give output',NAND(input1,input2))

   print('\nResults for the OR gate')
   for input1 in ['0','1']:
       for input2 in ['0','1']:
           print('    Inputs',input1,input2,'give output',OR(input1,input2))

.. code:: python

   import qiskit
   qiskit.__qiskit_version__

.. code:: python
