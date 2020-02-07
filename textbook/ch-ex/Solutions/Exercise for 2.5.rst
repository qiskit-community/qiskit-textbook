``python colab={} colab_type="code" id="CshpxnyNQQNu" from qiskit import * from qiskit.tools.visualization import plot_histogram from qiskit.providers.aer import noise from qiskit.compiler import transpile import numpy as np``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "pmm5uV8cQQN6"} -->

Solution: Building the best AND gate
====================================

In the first exercise you made and AND gate with quantum gates. This
time you’ll do the same again, but for a real device. Using real devices
gives you two major constraints to deal with. One is the connectivity,
and the other is noise.

The connectivity tells you what ``cx`` gates it is possible to do
perform directly. For example, the device ``ibmq_5_tenerife`` has five
qubits numbered from 0 to 4. It has a connectivity defined by

``python colab={} colab_type="code" id="wczhwQrcoQVB" coupling_map = [[1, 0], [2, 0], [2, 1], [3, 2], [3, 4], [4, 2]]``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "vrk5N1ZZpOmY"} -->

Here the ``[1,0]`` tells us that we can implement a ``cx`` with qubit 1
as control and qubit 0 as target, the ``[2,0]`` tells us we can have
qubit 2 as control and 0 as target, and so on. The are the ``cx`` gates
that the device can implement directly.

The ‘noise’ of a device is the collective effects of all the things that
shouldn’t happen, but nevertheless do happen. Noise results in the
output not always having the result we expect. There is noise associated
with all processes in a quantum circuit: preparing the initial states,
applying gates and measuring the output. For the gates, noise levels can
vary between different gates and between different qubits. The ``cx``
gates are typically more noisy than any single qubit gate.

We can also simulate noise using a noise model. And we can set the noise
model based on measurements of the noise for a real device. The
following noise model is based on ``ibmq_5_tenerife``.

.. raw:: html

   <!-- #endregion -->

``python colab={} colab_type="code" id="K9SSOA2RXOUo" noise_dict = {'errors': [{'type': 'qerror', 'operations': ['u2'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0004721766167523067, 0.0004721766167523067, 0.0004721766167523067, 0.9985834701497431], 'gate_qubits': [[0]]}, {'type': 'qerror', 'operations': ['u2'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0005151090708174488, 0.0005151090708174488, 0.0005151090708174488, 0.9984546727875476], 'gate_qubits': [[1]]}, {'type': 'qerror', 'operations': ['u2'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0005151090708174488, 0.0005151090708174488, 0.0005151090708174488, 0.9984546727875476], 'gate_qubits': [[2]]}, {'type': 'qerror', 'operations': ['u2'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.000901556048412383, 0.000901556048412383, 0.000901556048412383, 0.9972953318547628], 'gate_qubits': [[3]]}, {'type': 'qerror', 'operations': ['u2'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0011592423249461303, 0.0011592423249461303, 0.0011592423249461303, 0.9965222730251616], 'gate_qubits': [[4]]}, {'type': 'qerror', 'operations': ['u3'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0009443532335046134, 0.0009443532335046134, 0.0009443532335046134, 0.9971669402994862], 'gate_qubits': [[0]]}, {'type': 'qerror', 'operations': ['u3'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0010302181416348977, 0.0010302181416348977, 0.0010302181416348977, 0.9969093455750953], 'gate_qubits': [[1]]}, {'type': 'qerror', 'operations': ['u3'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0010302181416348977, 0.0010302181416348977, 0.0010302181416348977, 0.9969093455750953], 'gate_qubits': [[2]]}, {'type': 'qerror', 'operations': ['u3'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.001803112096824766, 0.001803112096824766, 0.001803112096824766, 0.9945906637095256], 'gate_qubits': [[3]]}, {'type': 'qerror', 'operations': ['u3'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0023184846498922607, 0.0023184846498922607, 0.0023184846498922607, 0.9930445460503232], 'gate_qubits': [[4]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.002182844139394187, 0.9672573379090872], 'gate_qubits': [[1, 0]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.0020007412998552473, 0.9699888805021712], 'gate_qubits': [[2, 0]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.002485439516158936, 0.9627184072576159], 'gate_qubits': [[2, 1]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.0037502825428055767, 0.9437457618579164], 'gate_qubits': [[3, 2]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.004401224333760022, 0.9339816349935997], 'gate_qubits': [[3, 4]]}, {'type': 'qerror', 'operations': ['cx'], 'instructions': [[{'name': 'x', 'qubits': [0]}], [{'name': 'y', 'qubits': [0]}], [{'name': 'z', 'qubits': [0]}], [{'name': 'x', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'x', 'qubits': [1]}], [{'name': 'y', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'y', 'qubits': [1]}], [{'name': 'z', 'qubits': [1]}], [{'name': 'x', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'y', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'z', 'qubits': [0]}, {'name': 'z', 'qubits': [1]}], [{'name': 'id', 'qubits': [0]}]], 'probabilities': [0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.0046188825262438934, 0.9307167621063416], 'gate_qubits': [[4, 2]]}, {'type': 'roerror', 'operations': ['measure'], 'probabilities': [[0.9372499999999999, 0.06275000000000008], [0.06275000000000008, 0.9372499999999999]], 'gate_qubits': [[0]]}, {'type': 'roerror', 'operations': ['measure'], 'probabilities': [[0.9345, 0.0655], [0.0655, 0.9345]], 'gate_qubits': [[1]]}, {'type': 'roerror', 'operations': ['measure'], 'probabilities': [[0.97075, 0.029249999999999998], [0.029249999999999998, 0.97075]], 'gate_qubits': [[2]]}, {'type': 'roerror', 'operations': ['measure'], 'probabilities': [[0.9742500000000001, 0.02574999999999994], [0.02574999999999994, 0.9742500000000001]], 'gate_qubits': [[3]]}, {'type': 'roerror', 'operations': ['measure'], 'probabilities': [[0.8747499999999999, 0.12525000000000008], [0.12525000000000008, 0.8747499999999999]], 'gate_qubits': [[4]]}], 'x90_gates': []} noise_model = noise.noise_model.NoiseModel.from_dict( noise_dict )``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "cR0-hEoSqgr8"} -->

Running directly on the device requires you to have an IBMQ account, and
for you to sign in to it within your program. In order to not worry
about all this, we’ll instead use a simulation of the 5 qubit device
defined by the constraints set above.

``python colab={} colab_type="code" id="MTQMjOzOWuw8"   qr = QuantumRegister(5, 'qr')   cr = ClassicalRegister(1, 'cr')   backend = Aer.get_backend('qasm_simulator')``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "e_p8IgvCrd5a"} -->

We now define the ``NAND`` function. This has a few differences to the
version in Exercise 1. Firstly, it is defined on a 5 qubit circuit, so
you’ll need to decide which of the 5 qubits are used to encode
``input1``, ``input2`` and the output. Secondly, the output is a
histogram of the number of times that each output is found when the
process is repeated over 10000 samples.

\```python colab={} colab_type=“code” id=“4yqeQMlZQQN\_” def AND
(input1,input2, q_1=0,q_2=1,q_out=2): # The keyword q_1 specifies the
qubit used to encode input1 # The keyword q_2 specifies qubit used to
encode input2 # The keyword q_out specifies qubit to be as output

qc = QuantumCircuit(qr, cr)

# prepare input on qubits q1 and q2 if input1==‘1’: qc.x( qr[ q_1 ] ) if
input2==‘1’: qc.x( qr[ q_2 ] )

qc.ccx(qr[ q_1 ],qr[ q_2 ],qr[ q_out ]) # the AND just needs a c
qc.measure(qr[ q_out ],cr[0]) # output from qubit 1 is measured

# the circuit is run on a simulator, but we do it so that the noise and
connectivity of Tenerife are also reproduced job = execute(qc, backend,
shots=10000, noise_model=noise_model, coupling_map=coupling_map,
basis_gates=noise_model.basis_gates) output = job.result().get_counts()

return output

::


   <!-- #region {"colab_type": "text", "id": "i7qCHniitYIZ"} -->
   For example, here are the results when both inputs are `0`.
   <!-- #endregion -->

   ```python colab={"base_uri": "https://localhost:8080/", "height": 339} colab_type="code" executionInfo={"elapsed": 4279, "status": "ok", "timestamp": 1553509296368, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="ZPRa9f8LtYeX" outputId="df5b2663-0531-4cfd-e6cf-395a8cb3eebd"
   result = AND('0','0')
   print( result )
   plot_histogram( result )

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "KzqsXxXcSlKN"} -->

We’ll compare across all results to find the most unreliable.

``python colab={"base_uri": "https://localhost:8080/", "height": 260} colab_type="code" executionInfo={"elapsed": 11198, "status": "ok", "timestamp": 1553509303307, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="5jbzYvA5f5bD" outputId="828ef3d2-b42c-4999-e893-eed78bd7d323" worst = 1 for input1 in ['0','1']:   for input2 in ['0','1']:     print('\nProbability of correct answer for inputs',input1,input2)     prob = AND(input1,input2, q_1=0,q_2=1,q_out=2)[str(int( input1=='1' and input2=='1' ))]/10000     print( prob )     worst = min(worst,prob) print('\nThe lowest of these probabilities was',worst)``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "b2ZFynrdSxFj"} -->

Our job is to make a better ``AND`` gate. Let’s start by looking at how
good the qubits are.

We’ll do this by running a trivial circuit using different qubits as
outputs. We can then see the probability that the output is incorrect,
giving a simply measure of noise for each qubit.

``python colab={"base_uri": "https://localhost:8080/", "height": 104} colab_type="code" executionInfo={"elapsed": 11496, "status": "ok", "timestamp": 1553509303625, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="qR5WxStVStPx" outputId="5d7321a8-3b05-4cec-82c9-8aaf4618f7f6" for j in range(5):   qc = QuantumCircuit(qr, cr)   qc.measure(qr[j],cr[0])   job = execute(qc, backend, shots=10000, noise_model=noise_model, coupling_map=coupling_map, basis_gates=noise_model.basis_gates)   output = job.result().get_counts()   print('Probability of incorrect output for qubit',j,'is',output['1']/10000)``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "5q4UDFbbTLYN"} -->

It looks like qubit 4 is the worst and qubits 2 and 3 are the best.

The implementation of an ``AND`` typically required us to have three
qubits in which one is connected to the other two. Unfortunately, the
only triple of qubits that include 2 and 3 must also include 4 to have
this property. So we would be mixing the best with the worst. Let’s try
it anyway.

``python colab={"base_uri": "https://localhost:8080/", "height": 260} colab_type="code" executionInfo={"elapsed": 14980, "status": "ok", "timestamp": 1553509307124, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="4ABQ3ZInUHlE" outputId="377c9bb1-9a32-4660-b495-974869300e64" worst = 1 for input1 in ['0','1']:   for input2 in ['0','1']:     print('\nProbability of correct answer for inputs',input1,input2)     prob = AND(input1,input2, q_1=3,q_2=4,q_out=2)[str(int( input1=='1' and input2=='1' ))]/10000     print( prob )     worst = min(worst,prob) print('\nThe lowest of these probabilities was',worst)``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "cEsZbW82UV5A"} -->

This is worse than the use of 0, 1 and 2 that was tried in the original
test. Though it doesn’t follow that that was neccessarily the best
triple to use, let’s stick with it anyway.

Let’s now use these three qubits to implement the ``AND`` described
`here <https://learnqiskit.gitbook.io/composerguide/quantum-algorithms/basic-circuit-identities>`__
which uses a controlled-Z and two controlled-Hs.

Qiskit gives us ``cz`` and ``ch`` to use directly.

\```python colab={} colab_type=“code” id=“DFzW7R2JuEXW” def AND
(input1,input2, q_1=0,q_2=1,q_out=2): # The keyword q_1 specifies the
qubit used to encode input1 # The keyword q_2 specifies qubit used to
encode input2 # The keyword q_out specifies qubit to be as output

qc = QuantumCircuit(qr, cr)

# prepare input on qubits q1 and q2 if input1==‘1’: qc.x( qr[ q_1 ] ) if
input2==‘1’: qc.x( qr[ q_2 ] )

qc.ch(qr[q_1],qr[q_out]) qc.cz(qr[q_2],qr[q_out])
qc.ch(qr[q_1],qr[q_out])

qc.measure(qr[ q_out ],cr[0]) # output from qubit 1 is measured

# the circuit is run on a simulator, but we do it so that the noise and
connectivity of Tenerife are also reproduced job = execute(qc, backend,
shots=10000, noise_model=noise_model, coupling_map=coupling_map,
basis_gates=noise_model.basis_gates) output = job.result().get_counts()

return output

::


   ```python colab={"base_uri": "https://localhost:8080/", "height": 260} colab_type="code" executionInfo={"elapsed": 7780, "status": "ok", "timestamp": 1553515227601, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="BbtmGdcjuOE3" outputId="2820c752-faaa-440b-9b75-49729bffc233"
   worst = 1
   for input1 in ['0','1']:
     for input2 in ['0','1']:
       print('\nProbability of correct answer for inputs',input1,input2)
       prob = AND(input1,input2, q_1=0,q_2=1,q_out=2)[str(int( input1=='1' and input2=='1' ))]/10000
       print( prob )
       worst = min(worst,prob)
   print('\nThe lowest of these probabilities was',worst)

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "GddO8td3ubQ7"} -->

The results aren’t great. Let’s look at the compiled circuit to see
what’s going on. Specifically, let’s see what’s going on for the
controlled Hadamard.

\```python colab={“base_uri”: “https://localhost:8080/”, “height”: 503}
colab_type=“code” executionInfo={“elapsed”: 850, “status”: “ok”,
“timestamp”: 1553515389340, “user”: {“displayName”: “James Wootton”,
“photoUrl”:
“https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg”,
“userId”: “11461323495081829290”}, “user_tz”: -60} id=“YCciy2qauo0V”
outputId=“e9d1f649-db3b-4fef-a458-03bf3975be71” qc = QuantumCircuit(qr,
cr) qc.ch(qr[1],qr[0]) print(‘Original circuit’) print(qc)

print(‘Compiled circuit’)

qc_compiled = transpile(qc,backend=backend) print(qc_compiled)

::


   <!-- #region {"colab_type": "text", "id": "3Pj8bfp7uT4W"} -->
   This uses more single qubit gates than are minimally required, so we can try to do better. Let's make our AND with a custum `ch`.
   <!-- #endregion -->

   ```python colab={} colab_type="code" id="I75oBAwbUx4w"
   def AND (input1,input2, q_1=0,q_2=1,q_out=2):
     # The keyword q_1 specifies the qubit used to encode input1
     # The keyword q_2 specifies  qubit used to encode input2
     # The keyword q_out specifies  qubit to be as output
     
     qc = QuantumCircuit(qr, cr)
     
     # prepare input on qubits q1 and q2
     if input1=='1':
       qc.x( qr[ q_1 ] )
     if input2=='1':
       qc.x( qr[ q_2 ] )
     
     qc.ry(-np.pi/4,qr[q_out])
     qc.cx(qr[q_1],qr[q_out])
     qc.ry(np.pi/4,qr[q_out])
     
     qc.cz(qr[q_2],qr[q_out])
     
     qc.ry(-np.pi/4,qr[q_out])
     qc.cx(qr[q_1],qr[q_out])
     qc.ry(np.pi/4,qr[q_out])
     
     qc.measure(qr[ q_out ],cr[0]) # output from qubit 1 is measured
     
     # the circuit is run on a simulator, but we do it so that the noise and connectivity of Tenerife are also reproduced 
     job = execute(qc, backend, shots=10000, noise_model=noise_model,
                          coupling_map=coupling_map,
                          basis_gates=noise_model.basis_gates)
     output = job.result().get_counts()
     
     return output

``python colab={"base_uri": "https://localhost:8080/", "height": 260} colab_type="code" executionInfo={"elapsed": 3659, "status": "ok", "timestamp": 1553515520214, "user": {"displayName": "James Wootton", "photoUrl": "https://lh4.googleusercontent.com/-XnQWpq03OeQ/AAAAAAAAAAI/AAAAAAAAAi0/qKYJsrtH0Oo/s64/photo.jpg", "userId": "11461323495081829290"}, "user_tz": -60} id="GqwD3yjoVVZH" outputId="aee7b7c0-58ca-47d2-a070-c9b6ee047f79" worst = 1 for input1 in ['0','1']:   for input2 in ['0','1']:     print('\nProbability of correct answer for inputs',input1,input2)     prob = AND(input1,input2, q_1=0,q_2=1,q_out=2)[str(int( input1=='1' and input2=='1' ))]/10000     print( prob )     worst = min(worst,prob) print('\nThe lowest of these probabilities was',worst)``

.. raw:: html

   <!-- #region {"colab_type": "text", "id": "yu_7vyLoXkke"} -->

A better result that the one in the question, as required.

\```python colab={} colab_type=“code” id=“9puVgP6ZVZDe”

\``\`
