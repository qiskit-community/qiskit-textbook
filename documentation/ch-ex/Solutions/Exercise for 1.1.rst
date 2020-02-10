.. code:: ipython3

    from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit, Aer, execute

Solutions: Classical logic gates with quantum circuits
======================================================

NOT gate
--------

This function takes a binary string input (``'0'`` or ``'1'``) and
returns the opposite binary output’.

.. code:: ipython3

    def NOT(input):
    
      q = QuantumRegister(1) # a qubit in which to encode the inout
      c = ClassicalRegister(1) # a bit to store the output
      qc = QuantumCircuit(q, c) # this is where the quantum program goes
      
      # We encode '0' as the qubit state |0⟩, and '1' as |1⟩
      # Since the qubit is initially |0⟩, we don't need to do anything for an input of '0'
      # For an input of '1', we do an x to rotate the |0⟩ to |1⟩
      if input=='1': #
        qc.x( q[0] )
        
      # Now we've encoded the input, we can do a NOT on it using x
      qc.x( q[0] )
      
      # Finally, we extract the |0⟩/|1⟩ output of the qubit and encode it in the bit c[0]
      qc.measure( q[0], c[0] )
      
      # We'll run the program on a simulator
      backend = Aer.get_backend('qasm_simulator')
      # Since the output will be deterministic, we can use just a single shot to get it
      job = execute(qc,backend,shots=1,memory=True)
      output = job.result().get_memory()[0]
      
      return output

XOR gate
--------

Takes two binary strings as input and gives one as output.

The output is ``'0'`` when the inputs are equal and ``'1'`` otherwise.

.. code:: ipython3

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

AND gate
--------

Takes two binary strings as input and gives one as output.

The output is ``'1'`` only when both the inputs are ``'1'``.

.. code:: ipython3

    def AND(input1,input2):
      
      q = QuantumRegister(3) # a qubit in which to encode the inout
      c = ClassicalRegister(1) # a bit to store the output
      qc = QuantumCircuit(q, c) # this is where the quantum program goes
      
      if input1=='1':
        qc.x( q[0] )
      if input2=='1':
        qc.x( q[1] )
      
      qc.ccx(q[0],q[1],q[2]) # just needs a ccx controlled on qubits 0 and 1 and targeted on 2
      qc.measure(q[2],c[0]) # output from qubit 2 is measured
      
      # We'll run the program on a simulator
      backend = Aer.get_backend('qasm_simulator')
      # Since the output will be deterministic, we can use just a single shot to get it
      job = execute(qc,backend,shots=1,memory=True)
      output = job.result().get_memory()[0]
      
      return output

NAND gate
---------

Takes two binary strings as input and gives one as output.

The output is ``'0'`` only when both the inputs are ``'1'``.

.. code:: ipython3

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

OR gate
-------

Takes two binary strings as input and gives one as output.

The output is ``'1'`` if either input is ``'1'``.

.. code:: ipython3

    def OR(input1,input2):
      
      q = QuantumRegister(3) # a qubit in which to encode the inout
      c = ClassicalRegister(1) # a bit to store the output
      qc = QuantumCircuit(q, c) # this is where the quantum program goes
      
      if input1=='1':
        qc.x( q[0] )
      if input2=='1':
        qc.x( q[1] )
        
      # can be done with NOTs on the inputs and output of an AND
      qc.x(q[0])
      qc.x(q[1])
      qc.ccx(q[0],q[1],q[2]) # the AND just needs a ccx controlled on qubits 0 and 1 and targeted on 2
      qc.x(q[2]) # the NOT is done to the qubit containing the output
      qc.measure(q[2],c[0]) # output from qubit 2 is measured
      
      # We'll run the program on a simulator
      backend = Aer.get_backend('qasm_simulator')
      # Since the output will be deterministic, we can use just a single shot to get it
      job = execute(qc,backend,shots=1,memory=True)
      output = job.result().get_memory()[0]
      
      return output

Tests
-----

The following code runs the functions above for all possible inputs, so
that you can check whether they work.

.. code:: ipython3

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


.. parsed-literal::

    
    Results for the NOT gate
        NOT with input 0 gives output 1
        NOT with input 1 gives output 0
    
    Results for the XOR gate
        NOT with inputs 0 0 gives output 0
        NOT with inputs 0 1 gives output 1
        NOT with inputs 1 0 gives output 1
        NOT with inputs 1 1 gives output 0
    
    Results for the AND gate
        NOT with inputs 0 0 gives output 0
        NOT with inputs 0 1 gives output 0
        NOT with inputs 1 0 gives output 0
        NOT with inputs 1 1 gives output 1
    
    Results for the NAND gate
        NOT with inputs 0 0 gives output 1
        NOT with inputs 0 1 gives output 1
        NOT with inputs 1 0 gives output 1
        NOT with inputs 1 1 gives output 0
    
    Results for the OR gate
        NOT with inputs 0 0 gives output 0
        NOT with inputs 0 1 gives output 1
        NOT with inputs 1 0 gives output 1
        NOT with inputs 1 1 gives output 1


