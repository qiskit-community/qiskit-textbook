``python colab={} colab_type="code" id="CshpxnyNQQNu" from qiskit import * from qiskit.tools.visualization import plot_histogram import numpy as np``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "pmm5uV8cQQN6"} -->

Solution: Basic synthesis of single qubit gates
===============================================

1
-

Show that the Hadamard gate can be written in the following two forms

.. math:: H = \frac{X+Z}{\sqrt{2}} \equiv \exp\left(i \frac{\pi}{2} \, \frac{X+Z}{\sqrt{2}}\right)

Here :math:`\equiv` is used to denote that the equality is valid up to a
global phase, and hence that the resulting gates are physically
equivalent.

Hint: it might even be easiest to prove that
:math:`e^{i\frac{\pi}{2} M} \equiv M` for any matrix whose eigenvalues
are all :math:`\pm 1`, and that such matrices uniquely satisfy
:math:`M^2=I`.

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "CJyxxSDUQQN9"} -->

.. _section-1:

2
-

The Hadamard can be constructed from ``rx`` and ``rz`` operations as

.. math::  R_x(\theta) = e^{i\frac{\theta}{2} X}, ~~~ R_z(\theta) = e^{i\frac{\theta}{2} Z},\\ H \equiv \lim_{n\rightarrow\infty} \left( ~R_x\left(\frac{\theta}{n}\right) ~~R_z \left(\frac{\theta}{n}\right) ~\right)^n

For some suitably chosen :math:`\theta`. When implemented for finite
:math:`n`, the resulting gate will be an approximation to the Hadamard
whose error decreases with :math:`n`.

The following shows an example of this implemented with Qiskit with an
incorrectly chosen value of :math:`\theta` (and with the global phase
ignored).

-  Determine the correct value of :math:`\theta`.

-  Show that the error (when using the correct value of :math:`\theta`)
   decreases quadratically with :math:`n`.

\```python colab={“base_uri”: “https://localhost:8080/”, “height”: 329}
colab_type=“code” executionInfo={“elapsed”: 3497, “status”: “ok”,
“timestamp”: 1552904155482, “user”: {“displayName”: “James Wootton”,
“photoUrl”:
“https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg”,
“userId”: “11461323495081829290”}, “user_tz”: -60} id=“4yqeQMlZQQN\_”
outputId=“4bb803d8-c0da-48a0-c413-d26749a2c22a” qr = QuantumRegister(1)
cr = ClassicalRegister(1)

error = {} for n in range(1,11):

::

   # Create a blank circuit
   qc = QuantumCircuit(qr,cr)

   # Implement an approximate Hadamard
   theta = np.pi/np.sqrt(2) # here we correctly choose theta=pi/sqrt(2)
   for j in range(n):
       qc.rx(theta/n,qr[0])
       qc.rz(theta/n,qr[0])
     
   # We need to measure how good the above approximation is. Here's a simple way to do this.
   # Step 1: Use a real hadamard to cancel the above approximation.
   # For a good approximatuon, the qubit will return to state 0. For a bad one, it will end up as some superposition.
   qc.h(qr[0])

   # Step 2: Run the circuit, and see how many times we get the outcome 1.
   # Since it should return 0 with certainty, the fraction of 1s is a measure of the error.
   qc.measure(qr,cr)
   shots = 20000
   job = execute(qc, Aer.get_backend('qasm_simulator'),shots=shots)
   try:
       error[n] = (job.result().get_counts()['1']/shots)
   except:
       pass
       

plot_histogram(error)

::


   ```python colab={"base_uri": "https://localhost:8080/", "height": 329} colab_type="code" executionInfo={"elapsed": 3480, "status": "ok", "timestamp": 1552904155490, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="dW8YTZJeQQON" outputId="372dd6e5-6e3e-4faa-efc8-37c6984239ed"
   # The linear nature of error^(-1/2) shows that the error has a quadratic decay.
   inverse_square_of_error = {}
   for n in error:
       inverse_square_of_error[n] = (error[n])**(-1/2)
   plot_histogram(inverse_square_of_error)

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "Yr5vuU_eQQOU"} -->

.. _section-2:

3
-

An improved version of the approximation can be found from,

.. math:: H \equiv \lim_{n\rightarrow\infty} \left( ~ R_z \left(\frac{\theta}{2n}\right)~~ R_x\left(\frac{\theta}{n}\right) ~~ R_z \left(\frac{\theta}{2n}\right) ~\right)^n

.

Implement this, and investigate the scaling of the error.

\```python colab={“base_uri”: “https://localhost:8080/”, “height”: 329}
colab_type=“code” executionInfo={“elapsed”: 5398, “status”: “ok”,
“timestamp”: 1552904157424, “user”: {“displayName”: “James Wootton”,
“photoUrl”:
“https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg”,
“userId”: “11461323495081829290”}, “user_tz”: -60} id=“JXScz_BtQQOV”
outputId=“6cd904d6-42da-4839-ce01-49eb5bb039e6” qr = QuantumRegister(1)
cr = ClassicalRegister(1)

error = {} for n in range(1,11):

::

   # Create a blank circuit
   qc = QuantumCircuit(qr,cr)

   # Implement an approximate Hadamard
   theta = np.pi/np.sqrt(2) # here we correctly use theta=pi/sqrt(2)
   for j in range(n):
       qc.rz(theta/(2*n),qr[0])
       qc.rx(theta/n,qr[0])
       qc.rz(theta/(2*n),qr[0])
     
   # We need to measure how good the above approximation is. Here's a simple way to do this.
   # Step 1: Use a real hadamard to cancel the above approximation.
   # For a good approximatuon, the qubit will return to state 0. For a bad one, it will end up as some superposition.
   qc.h(qr[0])

   # Step 2: Run the circuit, and see how many times we get the outcome 1.
   # Since it should return 0 with certainty, the fraction of 1s is a measure of the error.
   qc.measure(qr,cr)
   shots = 100000
   job = execute(qc, Aer.get_backend('qasm_simulator'),shots=shots)
   try:
       error[n] = (job.result().get_counts()['1']/shots)
   except:
       pass
       

plot_histogram(error)

::


   ```python colab={"base_uri": "https://localhost:8080/", "height": 329} colab_type="code" executionInfo={"elapsed": 5387, "status": "ok", "timestamp": 1552904157429, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="y10zaCS8QQOb" outputId="6e0850db-9e58-4398-e231-763daaba96f1"
   # The linear nature of error^(-1/3) shows that the error has a cubic decay.
   # Note: this needs loads of shots to get a good result.
   inverse_cube_of_error = {}
   for n in error:
       error[n]
       inverse_cube_of_error[n] = (error[n])**(-1/3)
   plot_histogram(inverse_cube_of_error)

\```python colab={} colab_type=“code” id=“TeQnxYGDQ2ro”

\``\`
