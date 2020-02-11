Simon’s Algorithm
=================

In this section, we first introduce the Simon problem, and classical and
quantum algorithms to solve it. We then implement the quantum algorithm
using Qiskit, and run on a simulator and device.

Contents
--------

.. contents:: Quick links throughout the document:


1. Introduction 
----------------

Simon’s algorithm, first introduced in Reference [1], was the first
quantum algorithm to show an exponential speed-up versus the best
classical algorithm in solving a specific problem. This inspired the
quantum algorithm for the discrete Fourier transform, also known as
quantum Fourier transform, which is used in the most famous quantum
algorithm: Shor’s factoring algorithm.

1a. Simon’s Problem  
~~~~~~~~~~~~~~~~~~~~

We are given an unknown blackbox function :math:`f`, which is guaranteed
to be either one-to-one or two-to-one, where one-to-one and two-to-one
functions have the following properties:

-  *one-to-one*: maps exactly one unique output for every input, eg.
   :math:`f(1) \rightarrow 1`, :math:`f(2) \rightarrow 2`,
   :math:`f(3) \rightarrow 3`, :math:`f(4) \rightarrow 4`.
-  *two-to-one*: maps exactly two inputs to every unique output, eg.
   :math:`f(1) \rightarrow 1`, :math:`f(2) \rightarrow 2`,
   :math:`f(3) \rightarrow 1`, :math:`f(4) \rightarrow 2`, according to
   a hidden bitstring, :math:`s`

   .. math::

      \textrm{where:  given }x_1,x_2: \quad f(x_1) = f(x_2) \\\\
      \textrm{it is guaranteed }: \quad x_1 \oplus x_2 = s

    Thus, given this blackbox :math:`f`, how quickly can we determine if
   :math:`f` is one-to-one or two-to-one? Then, if :math:`f` turns out
   to be two-to-one, how quickly can we determine :math:`s`? As it turns
   out, both cases boil down to the same problem of finding :math:`s`,
   where a bitstring of :math:`s={000...}` represents the one-to-one
   :math:`f`.

1b. Simon’s Algorithm  
~~~~~~~~~~~~~~~~~~~~~~

Classical Solution
^^^^^^^^^^^^^^^^^^

Classically, if we want to know what :math:`s` is for a given :math:`f`,
with 100% certainty, we have to check up to :math:`2^{N−1}+1` inputs,
where N is the number of bits in the input. This means checking just
over half of all the possible inputs until we find two cases of the same
output. Although, probabilistically the average number of inputs will be
closer to the order of :math:`\mathcal(o)(2)`. Much like the
Deutsch-Jozsa problem, if we get lucky, we could solve the problem with
our first two tries. But if we happen to get an :math:`f` that is
one-to-one, or get *really* unlucky with an :math:`f` that’s two-to-one,
then we’re stuck with the full :math:`2^{N−1}+1`.

Quantum Solution
^^^^^^^^^^^^^^^^

The quantum circuit that implements Simon’s algorithm is shown below.

Where the query function, :math:`\text{Q}_f` acts on two quantum
registers as:

.. math::  \lvert x \rangle \lvert 0 \rangle \rightarrow \lvert x \rangle \lvert f(x) \rangle 

The algorithm involves the following steps.

.. raw:: html

   <ol>

.. raw:: html

   <li>

Two :math:`n`-qubit input registers are initialized to the zero state:

.. math:: \lvert \psi_1 \rangle = \lvert 0 \rangle^{\otimes n} \lvert 0 \rangle^{\otimes n} 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply a Hadamard transform to the first register:

.. math:: \lvert \psi_2 \rangle = \frac{1}{\sqrt{2^n}} \sum_{x \in \{0,1\}^{n} } \lvert x \rangle\lvert 0 \rangle^{\otimes n}  

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply the query function :math:`\text{Q}_f`:

.. math::  \lvert \psi_3 \rangle = \frac{1}{\sqrt{2^n}} \sum_{x \in \{0,1\}^{n} } \lvert x \rangle \lvert f(x) \rangle  

.. raw:: html

   </li>

.. raw:: html

   <li>

Measure the second register. A certain value of :math:`f(x)` will be
observed. Because of the setting of the problem, the observed value
:math:`f(x)` could correspond to two possible inputs: :math:`x` and $y =
x :raw-latex:`\oplus `s $. Therefore the first register becomes:

.. math:: \lvert \psi_4 \rangle = \frac{1}{\sqrt{2}}  \left( \lvert x \rangle + \lvert y \rangle \right)

 where we omitted the second register since it has been measured.

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply Hadamard on the first register:

.. math::  \lvert \psi_5 \rangle = \frac{1}{\sqrt{2^{n+1}}} \sum_{z \in \{0,1\}^{n} } \left[  (-1)^{x \cdot z} + (-1)^{y \cdot z} \right]  \lvert z \rangle  

.. raw:: html

   </li>

.. raw:: html

   <li>

Measuring the first register will give an output of:

.. math::  (-1)^{x \cdot z} = (-1)^{y \cdot z} 

 which means:

.. math::

    x \cdot z = y \cdot z \\\\
        x \cdot z = \left( x \oplus s \right) \cdot z \\\\
        x \cdot z = x \cdot z \oplus s \cdot z \\\\
        s \cdot z = 0 \text{ (mod 2)} 

A string :math:`z` whose inner product with :math:`s` will be measured.
Thus, repeating the algorithm :math:`\approx n` times, we will be able
to obtain :math:`n` different values of :math:`z` and the following
system of equation can be written

.. math::  \begin{cases} s \cdot z_1 = 0 \\ s \cdot z_2 = 0 \\ ... \\ s \cdot z_n = 0 \end{cases}

 From which :math:`s` can be determined, for example by Gaussian
elimination.

.. raw:: html

   </li>

.. raw:: html

   </ol>

So, in this particular problem the quantum algorithm performs
exponentially fewer steps than the classical one. Once again, it might
be difficult to envision an application of this algorithm (although it
inspired the most famous algorithm created by Shor) but it represents
the first proof that there can be an exponential speed-up in solving a
specific problem by using a quantum computer rather than a classical
one.

2. Example 
-----------

Let’s see the example of Simon’s algorithm for 2 qubits with the secret
string :math:`s=11`, so that :math:`f(x) = f(y)` if
:math:`y = x \oplus s`. The quantum circuit to solve the problem is:

.. raw:: html

   <ol>

.. raw:: html

   <li>

Two :math:`2`-qubit input registers are initialized to the zero state:

.. math:: \lvert \psi_1 \rangle = \lvert 0 0 \rangle_1 \lvert 0 0 \rangle_2 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply Hadamard gates to the qubits in the first register:

.. math:: \lvert \psi_2 \rangle = \frac{1}{2} \left( \lvert 0 0 \rangle_1 + \lvert 0 1 \rangle_1 + \lvert 1 0 \rangle_1 + \lvert 1 1 \rangle_1 \right) \lvert 0 0 \rangle_2 

.. raw:: html

   </li>

.. raw:: html

   <li>

For the string :math:`s=11`, the query function can be implemented as
:math:`\text{Q}_f = CX_{13}CX_{14}CX_{23}CX_{24}`: \\begin{aligned}
:raw-latex:`\lvert `:raw-latex:`\psi`\_3 :raw-latex:`\rangle  `=
:raw-latex:`\frac{1}{2}` :raw-latex:`\left`(:raw-latex:`\lvert `0 0
:raw-latex:`\rangle`\_1 :raw-latex:`\lvert `0:raw-latex:`\oplus `0
:raw-latex:`\oplus `0, 0 :raw-latex:`\oplus `0 :raw-latex:`\oplus `0
:raw-latex:`\rangle`\_2 \\ + :raw-latex:`\lvert `0 1
:raw-latex:`\rangle`\_1 :raw-latex:`\lvert `0:raw-latex:`\oplus `0
:raw-latex:`\oplus `1, 0 :raw-latex:`\oplus `0 :raw-latex:`\oplus `1
:raw-latex:`\rangle`\_2 \\ + :raw-latex:`\lvert `1 0
:raw-latex:`\rangle`\_1 :raw-latex:`\lvert `0:raw-latex:`\oplus `1
:raw-latex:`\oplus `0, 0 :raw-latex:`\oplus `1 :raw-latex:`\oplus `0
:raw-latex:`\rangle`\_2 \\ + :raw-latex:`\lvert `1 1
:raw-latex:`\rangle`\_1 :raw-latex:`\lvert `0:raw-latex:`\oplus `1
:raw-latex:`\oplus `1, 0 :raw-latex:`\oplus `1 :raw-latex:`\oplus `1
:raw-latex:`\rangle`\_2 :raw-latex:`\right`) \\end{aligned}

Thus

.. math::  \lvert \psi_3 \rangle = \frac{1}{2} \left( \lvert 0 0 \rangle_1  \lvert 0 0 \rangle_2 + \lvert 0 1 \rangle_1 \lvert 1  1 \rangle_2 + \lvert 1 0 \rangle_1 \lvert  1   1  \rangle_2 + \lvert 1 1 \rangle_1 \lvert 0 0 \rangle_2 \right)  

.. raw:: html

   </li>

.. raw:: html

   <li>

We measure the second register. With :math:`50\%` probability we will
see either :math:`\lvert 0 0 \rangle_2` or :math:`\lvert 1 1 \rangle_2`.
For the sake of the example, let us assume that we see
:math:`\lvert 1 1 \rangle_2`. The state of the system is then

.. math::  \lvert \psi_4 \rangle = \frac{1}{\sqrt{2}}  \left( \lvert  0   1  \rangle_1 + \lvert  1   0  \rangle_1 \right)  

where we omitted the second register since it has been measured.

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply Hadamard on the first register

.. math::

    \lvert \psi_5 \rangle = \frac{1}{2\sqrt{2}} \left[ \left( \lvert 0 \rangle + \lvert 1 \rangle \right) \otimes \left( \lvert 0 \rangle - \lvert 1 \rangle \right) + \left( \lvert 0 \rangle - \lvert 1 \rangle \right) \otimes \left( \lvert 0 \rangle + \lvert 1 \rangle \right)  \right] \\\\
       =  \frac{1}{2\sqrt{2}} \left[ \lvert 0 0 \rangle - \lvert 0 1 \rangle + \lvert 1 0 \rangle - \lvert 1 1 \rangle   + \lvert 0 0 \rangle + \lvert 0 1 \rangle - \lvert 1 0 \rangle - \lvert 1 1 \rangle \right] \\\\
       = \frac{1}{\sqrt{2}} \left( \lvert 0 0 \rangle - \lvert 1 1 \rangle \right)

.. raw:: html

   </li>

.. raw:: html

   <li>

| Measuring the first register will give either
  :math:`\lvert 0, 0 \rangle` or :math:`\lvert 1, 1 \rangle` with equal
  probability. If we see :math:`\lvert 1, 1 \rangle`, then:
| 

  .. math::  s \cdot 11 = 0 

This is one equation, but :math:`s` has two variables. Therefore, we
need to repeat the algorithm at least another time to have enough
equations that will allow us to determine :math:`s`.

.. raw:: html

   </li>

.. raw:: html

   </ol>

3. Qiskit Implementation 
-------------------------

We now implement Simon’s algorithm for the above `example <example>`__
for :math:`2`-qubits with a :math:`s=11`.

.. code:: ipython3

    #initialization
    %matplotlib inline
    %config InlineBackend.figure_format = 'svg' # Makes the images look nice
    
    # importing Qiskit
    from qiskit import IBMQ, BasicAer
    from qiskit.providers.ibmq import least_busy
    from qiskit import QuantumCircuit, execute
    
    # import basic plot tools
    from qiskit.visualization import plot_histogram

.. code:: ipython3

    s = '11'

In Qiskit, measurements are only allowed at the end of the quantum
circuit. In the case of Simon’s algorithm, this simply means that we
need to move the measurements on the second register to the end.

.. code:: ipython3

    # Creating registers
    # qubits and classical bits for querying the oracle and finding the hidden period s
    n = 2*len(str(s))
    simonCircuit = QuantumCircuit(n)
    barriers = True
    
    # Apply Hadamard gates before querying the oracle
    simonCircuit.h(range(len(str(s))))    
        
    # Apply barrier 
    if barriers:
        simonCircuit.barrier()
    
    # Apply the query function
    ## 2-qubit oracle for s = 11
    simonCircuit.cx(0, len(str(s)) + 0)
    simonCircuit.cx(0, len(str(s)) + 1)
    simonCircuit.cx(1, len(str(s)) + 0)
    simonCircuit.cx(1, len(str(s)) + 1)  
    
    # Apply barrier 
    if barriers:
        simonCircuit.barrier()
    
    # Apply Hadamard gates to the input register
    simonCircuit.h(range(len(str(s))))
    
    # Measure ancilla qubits
    simonCircuit.measure_all()

.. code:: ipython3

    simonCircuit.draw(output='mpl')




.. image:: simon_files/simon_11_0.svg



3a. Experiment with Simulators 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the above circuit on the simulator.

.. code:: ipython3

    # use local simulator
    backend = BasicAer.get_backend('qasm_simulator')
    shots = 1024
    results = execute(simonCircuit, backend=backend, shots=shots).result()
    answer = results.get_counts()
    
    # Categorize measurements by input register values
    answer_plot = {}
    for measresult in answer.keys():
        measresult_input = measresult[len(str(s)):]
        if measresult_input in answer_plot:
            answer_plot[measresult_input] += answer[measresult]
        else:
            answer_plot[measresult_input] = answer[measresult] 
    
    # Plot the categorized results
    print( answer_plot )
    plot_histogram(answer_plot)


.. parsed-literal::

    {'11': 526, '00': 498}




.. image:: simon_files/simon_13_1.svg



.. code:: ipython3

    # Calculate the dot product of the results
    def sdotz(a, b):
        accum = 0
        for i in range(len(a)):
            accum += int(a[i]) * int(b[i])
        return (accum % 2)
    
    print('s, z, s.z (mod 2)')
    for z_rev in answer_plot:
        z = z_rev[::-1]
        print( '{}, {}, {}.{}={}'.format(s, z, s,z,sdotz(s,z)) )


.. parsed-literal::

    s, z, s.z (mod 2)
    11, 11, 11.11=0
    11, 00, 11.00=0


Using these results, we can recover the value of :math:`s = 11`.

3b. Experiment with Real Devices 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the circuit on the real device as below.

.. code:: ipython3

    # Load our saved IBMQ accounts and get the least busy backend device with less than or equal to 5 qubits
    IBMQ.load_account()
    provider = IBMQ.get_provider(hub='ibm-q')
    provider.backends()
    backend = least_busy(provider.backends(filters=lambda x: x.configuration().n_qubits >= n and 
                                       not x.configuration().simulator and x.status().operational==True))
    print("least busy backend: ", backend)


.. parsed-literal::

    least busy backend:  ibmq_burlington


.. code:: ipython3

    # Run our circuit on the least busy backend. Monitor the execution of the job in the queue
    from qiskit.tools.monitor import job_monitor
    
    shots = 1024
    job = execute(simonCircuit, backend=backend, shots=shots)
    
    job_monitor(job, interval = 2)


.. parsed-literal::

    Job Status: job has successfully run


.. code:: ipython3

    # Categorize measurements by input register values
    answer_plot = {}
    for measresult in answer.keys():
        measresult_input = measresult[len(str(s)):]
        if measresult_input in answer_plot:
            answer_plot[measresult_input] += answer[measresult]
        else:
            answer_plot[measresult_input] = answer[measresult] 
    
    # Plot the categorized results
    print( answer_plot )
    plot_histogram(answer_plot)


.. parsed-literal::

    {'11': 526, '00': 498}




.. image:: simon_files/simon_19_1.svg



.. code:: ipython3

    # Calculate the dot product of the most significant results
    print('s, z, s.z (mod 2)')
    for z_rev in answer_plot:
        if answer_plot[z_rev] >= 0.1*shots:
            z = z_rev[::-1]
            print( '{}, {}, {}.{}={}'.format(s, z, s,z,sdotz(s,z)) )


.. parsed-literal::

    s, z, s.z (mod 2)
    11, 11, 11.11=0
    11, 00, 11.00=0


As we can see, the most significant results are those for which
:math:`s.z = 0` (mod 2). Using a classical computer, we can then recover
the value of :math:`s` by solving the linear system of equations. For
this :math:`n=2` case, :math:`s = 11`.

4. Oracle 
----------

The above `example <#example>`__ and
`implementation <#implementation>`__ of Simon’s algorithm are
specifically for :math:`s=11`. To extend the problem to other secret bit
strings, we need to discuss the Simon query function or oracle in more
detail.

The Simon algorithm deals with finding a hidden bitstring
:math:`s \in \{0,1\}^n` from an oracle :math:`f_s` that satisfies
:math:`f_s(x) = f_s(y)` if and only if :math:`y = x \oplus s` for all
:math:`x \in \{0,1\}^n`. Here, the :math:`\oplus` is the bitwise XOR
operation. Thus, if :math:`s = 0\ldots 0`, i.e., the all-zero bitstring,
then :math:`f_s` is a 1-to-1 (or, permutation) function. Otherwise, if
:math:`s \neq 0\ldots 0`, then :math:`f_s` is a 2-to-1 function.

In the algorithm, the oracle receives :math:`|x\rangle|0\rangle` as
input. With regards to a predetermined :math:`s`, the oracle writes its
output to the second register so that it transforms the input to
:math:`|x\rangle|f_s(x)\rangle` such that :math:`f(x) = f(x\oplus s)`
for all :math:`x \in \{0,1\}^n`.

Such a blackbox function can be realized by the following procedures.

-  Copy the content of the first register to the second register.

   .. math::

      |x\rangle|0\rangle \rightarrow |x\rangle|x\rangle

-  **(Creating 1-to-1 or 2-to-1 mapping)** If :math:`s` is not all-zero,
   then there is the least index :math:`j` so that :math:`s_j = 1`. If
   :math:`x_j = 0`, then XOR the second register with :math:`s`.
   Otherwise, do not change the second register.

   .. math::

      |x\rangle|x\rangle \rightarrow |x\rangle|x \oplus s\rangle~\mbox{if}~x_j = 0~\mbox{for the least index j}

-  **(Creating random permutation)** Randomly permute and flip the
   qubits of the second register.

   .. math::

      |x\rangle|y\rangle \rightarrow |x\rangle|f_s(y)\rangle

5. Problems 
------------

1. Implement a general Simon oracle.
2. Test your general Simon oracle with the secret bitstring
   :math:`s=1001`, on a simulator and device. Are the results what you
   expect? Explain.

6. References 
--------------

1. Daniel R. Simon (1997) “On the Power of Quantum Computation” SIAM
   Journal on Computing, 26(5), 1474–1483,
   `doi:10.1137/S0097539796298637 <https://doi.org/10.1137/S0097539796298637>`__

.. code:: ipython3

    import qiskit
    qiskit.__qiskit_version__




.. parsed-literal::

    {'qiskit-terra': '0.11.1',
     'qiskit-aer': '0.3.4',
     'qiskit-ignis': '0.2.0',
     'qiskit-ibmq-provider': '0.4.5',
     'qiskit-aqua': '0.6.2',
     'qiskit': '0.14.1'}


