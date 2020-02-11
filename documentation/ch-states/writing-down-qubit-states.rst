Writing Down Qubit States
=========================

.. code:: ipython3

    from qiskit import *

In the previous chapter we saw that there are multiple ways to extract
an output from a qubit. The two methods we’ve used so far are the z and
x measurements.

.. code:: ipython3

    # z measurement of qubit 0
    measure_z = QuantumCircuit(1,1)
    measure_z.measure(0,0);
    
    # x measurement of qubit 0
    measure_x = QuantumCircuit(1,1)
    measure_x.h(0)
    measure_x.measure(0,0);

Sometimes these measurements give results with certainty. Sometimes
their outputs are random. This all depends on which of the infinitely
many possible states our qubit is in. We therefore need a way to write
down these states and figure out what outputs they’ll give. For this we
need some notation, and we need some math.

The z basis
~~~~~~~~~~~

If you do nothing in a circuit but a measurement, you are certain to get
the outcome ``0``. This is because the qubits always start in a
particular state, whose defining property is that it is certain to
output a ``0`` for a z measurement.

We need a name for this state. Let’s be unimaginative and call it
:math:`0` . Similarly, there exists a qubit state that is certain to
output a ``1``. We’ll call this :math:`1`.

These two states are completely mutually exclusive. Either the qubit
definitely outputs a ``0``, or it definitely outputs a ``1``. There is
no overlap.

One way to represent this with mathematics is to use two orthogonal
vectors.

.. math::

   |0\rangle = \begin{pmatrix} 1 \\\\\\ 0 \end{pmatrix} \, \, \, \, |1\rangle =\begin{pmatrix} 0 \\\\\\ 1 \end{pmatrix}.

 This is a lot of notation to take in all at once. First let’s unpack
the weird :math:`|` and :math:`\rangle` . Their job is essentially just
to remind us that we are talking about the vectors that represent qubit
states labelled :math:`0` and :math:`1`. This helps us distinguish them
from things like the bit values ``0`` and ``1`` or the numbers 0 and 1.
It is part of the bra-ket notation, introduced by Dirac.

If you are not familiar with vectors, you can essentially just think of
them as lists of numbers which we manipulate using certain rules. If you
are familiar with vectors from your high school physics classes, you’ll
know that these rules make vectors well-suited for describing quantities
with a magnitude and a direction. For example, velocity of an object is
described perfectly with a vector. However, the way we use vectors for
quantum states is slightly different to this. So don’t hold on too hard
to your previous intuition. It’s time to do something new!

In the example above, we wrote the vector as a vertical list of numbers.
We call these *column vectors*. In Dirac notation, they are also called
*kets*.

Horizontal lists are called *row vectors*. In Dirac notation they are
*bras*. They are represented with a :math:`\langle` and a :math:`|`.

.. math::

   \langle 0| = \begin{pmatrix} 1 & 0\end{pmatrix} \, \, \, \, \langle 1| =\begin{pmatrix} 0 & 1 \end{pmatrix}.

 The rules on how to manipulate vectors define what it means to add or
multiply them. For example, to add two vectors we need them to be the
same type (either both column vectors, or both row vectors) and the same
length. Then we add each element in one list to the corresponding
element in the other. For a couple of arbitrary vectors that we’ll call
:math:`a` and :math:`b`, this works as follows.

.. math::

   \begin{pmatrix} a_0 \\\\ a_1 \end{pmatrix} +\begin{pmatrix} b_0 \\\\ b_1 \end{pmatrix}=\begin{pmatrix} a_0+b_0 \\\\ a_1+b_1 \end{pmatrix}.

 To multiple a vector by a number, we simply multiply every element in
the list by that number:

.. math::

   x \times\begin{pmatrix} a_0 \\\\ a_1 \end{pmatrix} = \begin{pmatrix} x \times a_0 \\\\ x \times a_1 \end{pmatrix}

 Multiplying a vector with another vector is a bit more tricky, since
there are multiple ways we can do it. One is called the ‘inner product’,
and works as follows.

.. math::

   \begin{pmatrix} a_0 & a_1 \end{pmatrix} \begin{pmatrix} b_0 \\\\ b_1 \end{pmatrix}= a_0~b_0 + a_1~b_1.

 Note that the right hand side of this equation contains only normal
numbers being multipled and added in a normal way. The inner product of
two vectors therefore yields just a number. As we’ll see, we can
interpret this as a measure of how similar the vectors are.

The inner product requires the first vector to be a bra and the second
to be a ket. In fact, this is where their names come from. Dirac wanted
to write the inner product as something like
:math:`\langle a | b \rangle`, which looks like the names of the vectors
enclosed in brackets. Then he worked backwards to split the *bracket*
into a *bra* and a *ket*.

If you try out the inner product on the vectors we already know, you’ll
find

.. math::

   \langle 0 | 0\rangle = \langle 1 | 1\rangle = 1,\\\\
   \langle 0 | 1\rangle = \langle 1 | 0\rangle = 0.

 Here we are using a concise way of writing the inner products where,
for example, :math:`\langle 0 | 1 \rangle` is the inner product of
:math:`\langle 0 |` with :math:`| 1 \rangle`. The top line shows us that
the inner product of these states with themselves always gives a 1. When
done with two orthogonal states, as on the bottom line, we get the
outcome 0. These two properties will come in handy later on.

The x basis - part 1
~~~~~~~~~~~~~~~~~~~~

So far we’ve looked at states for which the z measurement has a certain
outcome. But there are also states for which the outcome of a z
measurement is equally likely to be ``0`` or ``1``. What might these
look like in the language of vectors?

A good place to start would be something like
:math:`|0\rangle + |1\rangle` , since this includes both
:math:`|0\rangle` and :math:`|1\rangle` with no particular bias towards
either. But let’s hedge our bets a little and multiply it by some number
:math:`x` .

.. math::

   x ~ (|0\rangle + |1\rangle) = \begin{pmatrix} x \\\\ x \end{pmatrix}

 We can choose the value of :math:`x` to make sure that the state plays
nicely in our calculations. For example, think about the inner product,

.. math::

   \begin{pmatrix} x & x \end{pmatrix} \times \begin{pmatrix} x \\\\ x \end{pmatrix}= 2x^2.

 We can get any value for the inner product that we want, just by
choosing the appropriate value of :math:`x`.

As mentioned earlier, we are going to use the inner product as a measure
of how similar two vectors are. With this interpretation in mind, it is
natural to require that the inner product of any state with itself gives
the value :math:`1`. This is already acheived for the inner products of
:math:`|0\rangle` and :math:`|1\rangle` with themselves, so let’s make
it true for all other states too.

This condition is known as the normalization condition. In this case, it
means that :math:`x=\frac{1}{\sqrt{2}}`. Now we know what our new state
is, so here’s a few ways of writing it down.

.. math::

   \begin{pmatrix} \frac{1}{\sqrt{2}} \\\\ \frac{1}{\sqrt{2}} \end{pmatrix} = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\\\ 1 \end{pmatrix} = \frac{ |0\rangle + |1\rangle}{\sqrt{2}}

 This state is essentially just :math:`|0\rangle` and :math:`|1\rangle`
added together and then normalized, so we will give it a name to reflect
that origin. We call it :math:`|+\rangle` .

The Born rule
~~~~~~~~~~~~~

Now we’ve got three states that we can write down as vectors. We can
also calculate inner products for them. For example, the inner product
of each with :math:`\langle 0 |` is

.. math::

   \langle 0 | 0\rangle = 1 \\\\ \langle 0 | 1\rangle = 0 \\\\ \, \, \, \, \langle 0 | +\rangle = \frac{1}{\sqrt{2}}.

 We also know the probabilities of getting various outcomes from a z
measurement for these states. For example, let’s use :math:`p^z_0` to
denote the probability of the result ``0`` for a z measurement. The
values this has for our three states are

.. math::

   p_0^z( | 0\rangle) = 1,\\\\ p_0^z( | 1\rangle) = 0, \\\\ p_0^z( | +\rangle) = \frac{1}{2}.

 As you might have noticed, there’s a lot of similarlity between the
numbers we get from the inner products and those we get for the
probabilities. Specifically, the three probabilities can all be written
as the square of the inner products:

.. math::

   p_0^z(|a\rangle) = (~\langle0|a\rangle~)^2.

 Here :math:`|a\rangle` represents any generic qubit state.

This property doesn’t just hold for the ``0`` outcome. If we compare the
inner products with :math:`\langle 1 |` with the probabilities of the
``1`` outcome, we find a similar relation.

.. math::

   \\\\
   p_1^z(|a\rangle) = (~\langle1|a\rangle~)^2.

 The same also holds true for other types of measurement. All
probabilities in quantum mechanics can be expressed in this way. It is
known as the *Born rule*.

Global and relative phases
~~~~~~~~~~~~~~~~~~~~~~~~~~

Vectors are how we use math to represent the state of a qubit. With them
we can calculate the probabilities of all the possible things that could
ever be measured. These probabilities are essentially all that is
physically relevant about a qubit. It is by measuring them that we can
determine or verify what state our qubits are in. Any aspect of the
state that doesn’t affect the probabilities is therefore just a
mathematical curiosity.

Let’s find an example. Consider a state that looks like this:

.. math::

   |\tilde 0\rangle = \begin{pmatrix} -1 \\\\ 0 \end{pmatrix} = -|0\rangle.

 This is equivalent to multiplying the state :math:`|0\rangle` by
:math:`-1`. It means that every inner product we could calculate with
:math:`|\tilde0\rangle` is the same as for :math:`|0\rangle`, but
multplied by :math:`-1`.

.. math::

   \langle a|\tilde 0\rangle = -\langle a| 0\rangle

 As you probably know, any negative number squares to the same value as
its positive counterpart: :math:`(-x)^2 =x^2`.

Since we square inner products to get probabilities, this means that any
probability we could ever calculate for :math:`|\tilde0\rangle` will
give us the same value as for :math:`|0\rangle`. If the probabilities of
everything are the same, there is no observable difference between
:math:`|\tilde0\rangle` and :math:`|0\rangle`; they are just different
ways of representing the same state.

This is known as the irrelevance of the global phase. Quite simply, this
means that multplying the whole of a quantum state by :math:`-1` gives
us a state that will look different mathematically, but which is
actually completely equivalent physically.

The same is not true if the phase is *relative* rather than *global*.
This would mean multiplying only part of the state by :math:`-1` , for
example:

.. math::

   \begin{pmatrix} a_0 \\\\ a_1 \end{pmatrix} \rightarrow \begin{pmatrix} a_0 \\\\ -a_1 \end{pmatrix}.

 Doing this with the :math:`|+\rangle` state gives us a new state. We’ll
call it :math:`|-\rangle`.

.. math::

   |-\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\\\ -1 \end{pmatrix} = \frac{ |0\rangle - |1\rangle}{\sqrt{2}}

 The values :math:`p_0^z` and :math:`p_1^z` for :math:`|-\rangle` are
the same as for :math:`|+\rangle`. These two states are thus
indistinguishable when we make only z measurements. But there are other
ways to distinguish them. To see how, consider the inner product of
:math:`|+\rangle` and :math:`|-\rangle`.

.. math::

   \langle-|+\rangle = \langle+|-\rangle = 0

 The inner product is 0, just as it is for :math:`|0\rangle` and
:math:`|1\rangle`. This means that the :math:`|+\rangle` and
:math:`|-\rangle` states are orthogonal: they represent a pair of
mutually exclusive possible ways for a qubit to be a qubit.

The x basis - part 2
~~~~~~~~~~~~~~~~~~~~

Whenever we find a pair of orthogonal qubit states, we can use it to
define a new kind of measurement.

First, let’s apply this to the case we know well: the z measurement.
This asks a qubit whether it is :math:`|0\rangle` or :math:`|1\rangle`.
If it is :math:`|0\rangle`, we get the result ``0``. For
:math:`|1\rangle` we get ``1``. Anything else, such as
:math:`|+\rangle`, is treated as a superposition of the two.

.. math::

   |+\rangle = \frac{|0\rangle+|1\rangle}{\sqrt{2}}.

 For a superposition, the qubit needs to randomly choose between the two
possibilities according to the Born rule.

We can similarly define a measurement based on :math:`|+\rangle` and
:math:`|-\rangle`. This asks a qubit whether it is :math:`|+\rangle` or
:math:`|-\rangle`. If it is :math:`|+\rangle`, we get the result ``0``.
For :math:`|-\rangle` we get ``1``. Anything else is treated as a
superposition of the two. This includes the states :math:`|0\rangle` and
:math:`|1\rangle`, which we can write as

.. math::

   |0\rangle = \frac{|+\rangle+|-\rangle}{\sqrt{2}}, \, \, \, \, |1\rangle = \frac{|+\rangle-|-\rangle}{\sqrt{2}}.

 For these, and any other superpositions of :math:`|+\rangle` and
:math:`|-\rangle`, the qubit chooses its outcome randomly with
probabilities

.. math::

   p_0^x(|a\rangle) = (~\langle+|a\rangle~)^2,\\\\
   p_1^x(|a\rangle) = (~\langle-|a\rangle~)^2.

 This is the x measurement.

The conservation of certainty
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Qubits in quantum circuits always start out in the state
:math:`|0\rangle`. By applying different operations, we can make them
explore other states.

Try this out yourself using a single qubit, creating circuits using
operations from the following list, and then doing the x and z
measurements in the way described at the top of the page.

.. code:: ipython3

    qc = QuantumCircuit(1)
    
    qc.h(0) # the hadamard
    
    qc.x(0) # x gate
    
    qc.y(0) # y gate
    
    qc.z(0) # z gate
    
    # for the following, replace theta by any number
    theta = 3.14159/4
    qc.ry(theta,0); # y axis rotation

You’ll find examples where the z measurement gives a certain result, but
the x is completely random. You’ll also find examples where the opposite
is true. Furthermore, there are many examples where both are partially
random. With enough experimentation, you might even uncover the rule
that underlies this behavior:

.. math::

   (p^z_0-p^z_1)^2 + (p^x_0-p^x_1)^2 = 1.

 This is a version of Heisenberg’s famous uncertainty principle. The
:math:`(p^z_0-p^z_1)^2` term measures how certain the qubit is about the
outcome of a z measurement. The :math:`(p^x_0-p^x_1)^2` term measures
the same for the x measurement. Their sum is the total certainty of the
two combined. Given that this total always takes the same value, we find
that the amount of information a qubit can be certain about is a limited
and conserved resource.

Here is a program to calculate this total certainty. As you should see,
whatever gates from the above list you choose to put in ``qc``, the
total certainty comes out as :math:`1` (or as near as possible given
statistical noise).

.. code:: ipython3

    shots = 2**14 # number of samples used for statistics
    
    uncertainty = 0
    for measure_circuit in [measure_z, measure_x]:
    
        # run the circuit with a the selected measurement and get the number of samples that output each bit value
        counts = execute(qc+measure_circuit,Aer.get_backend('qasm_simulator'),shots=shots).result().get_counts()
    
        # calculate the probabilities for each bit value
        probs = {}
        for output in ['0','1']:
            if output in counts:
                probs[output] = counts[output]/shots
            else:
                probs[output] = 0
                
        uncertainty += ( probs['0'] -  probs['1'] )**2
    
    # print the total uncertainty
    print('The total uncertainty is',uncertainty )


.. parsed-literal::

    The total uncertainty is 0.9984327554702759


Now we have found this rule, let’s try to break it! Then we can hope to
get a deeper understanding of what is going on. We can do this by simply
implementing the operation below, and then recalculating the total
uncertainty.

.. code:: ipython3

    # for the following, replace theta by any number
    theta = 3.14159/2
    qc.rx(theta,0); # x axis rotation

For a circuit with a single ``rx`` with :math:`\theta=\pi/2`, we will
find that :math:`(p^z_0-p^z_1)^2 + (p^x_0-p^x_1)^2=0`. This operation
seems to have reduced our total certainty to zero.

All is not lost, though. We simply need to perform another identical
``rx`` gate to our circuit to go back to obeying
:math:`(p^z_0-p^z_1)^2 + (p^x_0-p^x_1)^2=1`. This shows that the
operation does not destroy our certainty; it simply moves it somewhere
else and then back again. So let’s find that somewhere else.

The y basis - part 1
~~~~~~~~~~~~~~~~~~~~

There are infinitely many ways to measure a qubit, but the z and x
measurements have a special relationship with each other. We say that
they are *mutually unbiased*. This simply means that certainty for one
implies complete randomness for the other.

At the end of the last section, it seemed that we were missing a piece
of the puzzle. We need another type of measurement to plug the gap in
our total certainty, and it makes sense to look for one that is also
mutually unbiased with x and z.

The first step is to find a state that seems random to both x and z
measurements. Let’s call it :math:`|\circlearrowleft\rangle`, for no
apparent reason.

.. math::

   |\circlearrowleft\rangle = c_0 | 0 \rangle + c_1 | 1 \rangle

 Now the job is to find the right values for :math:`c_0` and
:math:`c_1`. You could try to do this with standard positive and
negative numbers, but you’ll never be able to find a state that is
completely random for both x and z measurements. To achieve this, we
need to use complex numbers.

Complex numbers
~~~~~~~~~~~~~~~

Hopefully you’ve come across complex numbers before, but here is a quick
reminder.

Normal numbers, such as the ones we use for counting bananas, are known
as *real numbers*. We cannot solve all possible equations using only
real numbers. For example, there is no real number that serves as the
square root of :math:`-1`. To deal with this issue, we need more
numbers, which we call *complex numbers*.

To define complex numbers we start by accepting the fact that :math:`-1`
has a square root, and that its name is :math:`i`. Any complex number
can then be written

.. math::

   x = x_r + i~x_i .

 Here :math:`x_r` and :math:`x_i` are both normal numbers (positive or
negative), where :math:`x_r` is known as the real part and :math:`x_i`
as the imaginary part.

For every complex number :math:`x` there is a corresponding complex
conjugate :math:`x^*`

.. math::

   x^* = x_r - i~x_i .

 Multiplying :math:`x` by :math:`x^*` gives us a real number. It’s most
useful to write this as

.. math::

   |x| = \sqrt{x~x^*}.

 Here :math:`|x|` is known as the magnitude of :math:`x` (or,
equivalently, of :math:`x^*` ).

If we are going to allow the numbers in our quantum states to be
complex, we’ll need to upgrade some of our equations.

First, we need to ensure that the inner product of a state with itself
is always 1. To do this, the bra and ket versions of the same state must
be defined as follows:

.. math::

   |a\rangle = \begin{pmatrix} a_0 \\\\ a_1 \end{pmatrix}, ~~~ \langle a| = \begin{pmatrix} a_0^* & a_1^* \end{pmatrix}.

 Then we just need a small change to the Born rule, where we square the
magnitudes of inner products, rather than just the inner products
themselves.

.. math::

   p_0^z(|a\rangle) = |~\langle0|a\rangle~|^2,\\\\
   p_1^z(|a\rangle) = |~\langle1|a\rangle~|^2,\\\\
   p_0^x(|a\rangle) = |~\langle+|a\rangle~|^2,\\\\
   p_1^x(|a\rangle) = |~\langle-|a\rangle~|^2.

 The irrelevance of the global phase also needs an upgrade. Previously,
we only talked about multiplying by -1. In fact, we can multiply a state
by any complex number whose magnitude is 1. This will give us a state
that will look different, but which is actually completely equivalent.
This includes multiplying by :math:`i`, :math:`-i` or infinitely many
other possibilities.

The y basis - part 2
~~~~~~~~~~~~~~~~~~~~

Now that we have complex numbers, we can define the following pair of
states.

.. math::

   |\circlearrowright\rangle = \frac{ | 0 \rangle + i | 1 \rangle}{\sqrt{2}}, ~~~~ |\circlearrowleft\rangle = \frac{ | 0 \rangle -i | 1 \rangle}{\sqrt{2}}

 You can verify yourself that they both give random outputs for x and z
measurements. They are also orthogonal to each other. They therefore
define a new measurement, and that basis is mutally unbiased with x and
z. This is the third and final fundamental measurement for a single
qubit. We call it the y measurement, and can implement it with

.. code:: ipython3

    # y measurement of qubit 0
    measure_y = QuantumCircuit(1,1)
    measure_y.sdg(0)
    measure_y.h(0)
    measure_y.measure(0,0);

With the x, y and z measurements, we now have everything covered.
Whatever operations we apply, a single isolated qubit will always obey

.. math::

   (p^z_0-p^z_1)^2 + (p^y_0-p^y_1)^2 + (p^x_0-p^x_1)^2 = 1.

 To see this, we can incorporate the y measurement into our measure of
total certainty.

.. code:: ipython3

    shots = 2**14 # number of samples used for statistics
    
    uncertainty = 0
    for measure_circuit in [measure_z, measure_x, measure_y]:
    
        # run the circuit with a the selected measurement and get the number of samples that output each bit value
        counts = execute(qc+measure_circuit,Aer.get_backend('qasm_simulator'),shots=shots).result().get_counts()
    
        # calculate the probabilities for each bit value
        probs = {}
        for output in ['0','1']:
            if output in counts:
                probs[output] = counts[output]/shots
            else:
                probs[output] = 0
                
        uncertainty += ( probs['0'] -  probs['1'] )**2
    
    # print the total uncertainty
    print('The total uncertainty is',uncertainty )


.. parsed-literal::

    The total uncertainty is 1.0074288547039032


For more than one qubit, this relation will need another upgrade. This
is because the qubits can spend their limited certainty on creating
correlations that can only be detected when multiple qubits are
measured. The fact that certainty is conserved remains true, but it can
only be seen when looking at all the qubits together.

Before we move on to entanglement, there is more to explore about just a
single qubit. As we’ll see in the next section, the conservation of
certainty leads to a particularly useful way of visualizing single-qubit
states and gates.

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


