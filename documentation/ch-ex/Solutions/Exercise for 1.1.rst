.. code:: python

   from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit, Aer, execute

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "ccfRql22_IBL"} -->

Solutions: Classical logic gates with quantum circuits
======================================================

.. raw:: html

   <!-- #endregion -->

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "OKCkpBD0_c6L"} -->

NOT gate
--------

This function takes a binary string input (``'0'`` or ``'1'``) and
returns the opposite binary output’.

\```python colab={} colab_type=“code” id=“6JPMpemG_RMb” def NOT(input):

q = QuantumRegister(1) # a qubit in which to encode the inout c =
ClassicalRegister(1) # a bit to store the output qc = QuantumCircuit(q,
c) # this is where the quantum program goes

# We encode ‘0’ as the qubit state \|0⟩, and ‘1’ as \|1⟩ # Since the
qubit is initially \|0⟩, we don’t need to do anything for an input of
‘0’ # For an input of ‘1’, we do an x to rotate the \|0⟩ to \|1⟩ if
input==‘1’: # qc.x( q[0] )

# Now we’ve encoded the input, we can do a NOT on it using x qc.x( q[0]
)

# Finally, we extract the \|0⟩/|1⟩ output of the qubit and encode it in
the bit c[0] qc.measure( q[0], c[0] )

# We’ll run the program on a simulator backend =
Aer.get_backend(‘qasm_simulator’) # Since the output will be
deterministic, we can use just a single shot to get it job =
execute(qc,backend,shots=1,memory=True) output =
job.result().get_memory()[0]

return output

::


   <!-- #region {"colab_type": "text", "id": "Gd-9DEAaAarK"} -->
   ## XOR gate

   Takes two binary strings as input and gives one as output.

   The output is `'0'` when the inputs are equal and  `'1'` otherwise.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="oPVCyyaHAays"
   def XOR(input1,input2):
     
     q = QuantumRegister(2) # a qubit in which to encode the inout
     c = ClassicalRegister(1) # a bit to store the output
     qc = QuantumCircuit(q, c) # this is where the quantum program goes
     
     if input1=='1':
       qc.x( q[0] )
     if input2=='1':
       qc.x( q[1] )
     
     qc.cx(q[0],q[1]) # just needs a cnot
     qc.measure(q[1],c[0]) # output from qubit 1 is measured
     
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

Takes two binary strings as input and gives one as output.

The output is ``'1'`` only when both the inputs are ``'1'``.

\```python colab={} colab_type=“code” id=“HdYfpnslAAeJ” def
AND(input1,input2):

q = QuantumRegister(3) # a qubit in which to encode the inout c =
ClassicalRegister(1) # a bit to store the output qc = QuantumCircuit(q,
c) # this is where the quantum program goes

if input1==‘1’: qc.x( q[0] ) if input2==‘1’: qc.x( q[1] )

qc.ccx(q[0],q[1],q[2]) # just needs a ccx controlled on qubits 0 and 1
and targeted on 2 qc.measure(q[2],c[0]) # output from qubit 2 is
measured

# We’ll run the program on a simulator backend =
Aer.get_backend(‘qasm_simulator’) # Since the output will be
deterministic, we can use just a single shot to get it job =
execute(qc,backend,shots=1,memory=True) output =
job.result().get_memory()[0]

return output

::


   <!-- #region {"colab_type": "text", "id": "OXfchiSyAAoo"} -->
   ## NAND gate

   Takes two binary strings as input and gives one as output.

   The output is `'0'` only when both the inputs are `'1'`.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="nJhmG115AAwv"
   def NAND(input1,input2):
     
     q = QuantumRegister(3) # a qubit in which to encode the inout
     c = ClassicalRegister(1) # a bit to store the output
     qc = QuantumCircuit(q, c) # this is where the quantum program goes
     
     if input1=='1':
       qc.x( q[0] )
     if input2=='1':
       qc.x( q[1] )
       
     # can be done with an AND followed by a NOT
     qc.ccx(q[0],q[1],q[2]) # the AND just needs a ccx controlled on qubits 0 and 1 and targeted on 2
     qc.x(q[2]) # the NOT is done to the qubit containing the output
     qc.measure(q[2],c[0]) # output from qubit 2 is measured
     
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

Takes two binary strings as input and gives one as output.

The output is ``'1'`` if either input is ``'1'``.

\```python colab={} colab_type=“code” id="_gofB196ABMj" def
OR(input1,input2):

q = QuantumRegister(3) # a qubit in which to encode the inout c =
ClassicalRegister(1) # a bit to store the output qc = QuantumCircuit(q,
c) # this is where the quantum program goes

if input1==‘1’: qc.x( q[0] ) if input2==‘1’: qc.x( q[1] )

# can be done with NOTs on the inputs and output of an AND qc.x(q[0])
qc.x(q[1]) qc.ccx(q[0],q[1],q[2]) # the AND just needs a ccx controlled
on qubits 0 and 1 and targeted on 2 qc.x(q[2]) # the NOT is done to the
qubit containing the output qc.measure(q[2],c[0]) # output from qubit 2
is measured

# We’ll run the program on a simulator backend =
Aer.get_backend(‘qasm_simulator’) # Since the output will be
deterministic, we can use just a single shot to get it job =
execute(qc,backend,shots=1,memory=True) output =
job.result().get_memory()[0]

return output

::


   <!-- #region {"colab_type": "text", "id": "flbXaXrY_pNz"} -->
   ## Tests

   The following code runs the functions above for all possible inputs, so that you can check whether they work.
   <!-- #endregion -->

   ```python colab={"base_uri": "https://localhost:8080/", "height": 503} colab_type="code" executionInfo={"elapsed": 1018, "status": "ok", "timestamp": 1552903179929, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="S9hyGAZ9_VQc" outputId="db6acf59-da89-4469-a12c-0dcdeddc4cf8"
   print('\nResults for the NOT gate')
   for input in ['0','1']:
     print('    NOT with input',input,'gives output',NOT(input))
     
   print('\nResults for the XOR gate')
   for input1 in ['0','1']:
     for input2 in ['0','1']:
       print('    NOT with inputs',input1,input2,'gives output',XOR(input1,input2))
     
   print('\nResults for the AND gate')
   for input1 in ['0','1']:
     for input2 in ['0','1']:
       print('    NOT with inputs',input1,input2,'gives output',AND(input1,input2))
     
   print('\nResults for the NAND gate')
   for input1 in ['0','1']:
     for input2 in ['0','1']:
       print('    NOT with inputs',input1,input2,'gives output',NAND(input1,input2))
     
   print('\nResults for the OR gate')
   for input1 in ['0','1']:
     for input2 in ['0','1']:
       print('    NOT with inputs',input1,input2,'gives output',OR(input1,input2))

\```python colab={} colab_type=“code” id=“LQT8YfpMNBfH”

\``\`
