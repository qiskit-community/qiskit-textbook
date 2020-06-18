from qiskit import ClassicalRegister, QuantumRegister, QuantumCircuit
from qiskit import execute, BasicAer
from random import randint

def Alice(AlicesColor, AlicesShape): global a_color; global a_shape; a_color=AlicesColor; a_shape = AlicesShape;
def Bob(BobsColor, BobsShape): global b_color; global b_shape; b_color=BobsColor; b_shape = BobsShape;
def You(YourColor, YourShape): global y_color; global y_shape; y_color=YourColor; y_shape = YourShape;

def geta_color(): return a_color;
def getb_color(): return b_color;
def gety_color(): return y_color;
def geta_shape(): return a_shape;
def getb_shape(): return b_shape;
def gety_shape(): return y_shape;

def ghz_state(qc,q):
    # create GHZ state
    qc.h(q[0])
    qc.cx(q[0],q[1])
    qc.cx(q[0],q[2])
    qc.barrier()
    return qc

def runExperiment():
    for i in range (1,5):
        correctEinstein = False; correctSchr = False;
        # create the quantum circuit with the chosen coin moves
        q = QuantumRegister(3) # create a quantum register with one qubit
        # create a classical register that will hold the results of the measurement
        c = ClassicalRegister(3) 
        qc = QuantumCircuit(q, c) # creates the quantum circuit
        ghz_state(qc,q) # bring circuit in ghz_state
        if (i ==1): # ask all for color
            # team Einstein (classical)
            if (a_color*b_color*y_color == -1): correctEinstein = True; # if the product of the x values = -1 -> win
            # team Schrödinger (quantum)
            xxx(qc, q)
            counts = simulate(qc, q, c, 1)
            if ("000" in counts or "011" in counts or "101" in counts or "110" in counts): correctSchr = True; # if the product of the x values = -1 -> win 
        else:
            if (i==2): # if the random number is 1 make an XYY-measurement
                if (a_color*b_shape*y_shape == 1): correctEinstein = True;
                xyy(qc, q)
            elif (i==3): # YXY-measurement
                if (a_shape*b_color*y_shape == 1): correctEinstein = True;
                yxy(qc, q)
            elif (i==4): # YYX-measurement
                if (a_shape*b_shape*y_color == 1): correctEinstein = True;
                yyx(qc, q)
            counts = simulate(qc, q, c, 1)
            if ("001" in counts or "010" in counts or "100" in counts or "111" in counts): correctSchr = True; # if product = 1 -> win
        print ("Round ", i, ", Question ", i)
        if (correctSchr == True and correctEinstein != True): print ("Team Einstein was wrong, Team Schrödinger was right"); 
        elif (correctSchr != True and correctEinstein == True): print ("Team Einstein was right, Team Schrödinger was wrong");
        else: print ("Both teams were right")
        i = i+1;

def xxx(qc, q):
    qc.h(q[0])
    qc.h(q[1])
    qc.h(q[2])
    return qc

def xyy(qc, q):
    qc.h(q[0])
    qc.sdg(q[1])
    qc.h(q[1])
    qc.sdg (q[2])
    qc.h(q[2])
    return qc

def yxy(qc, q):
    qc.sdg(q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.sdg (q[2])
    qc.h(q[2])
    return qc

def yyx(qc, q):
    qc.sdg(q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.sdg(q[2])
    qc.h(q[2])
    return qc

def simulate(qc, q, c, s):
    backend = BasicAer.get_backend('qasm_simulator') # define the backend
    qc.measure(q,c) 
    job = execute(qc, backend, shots=s) # run the job simulation
    result = job.result() # grab the result
    counts = result.get_counts(qc) # results for the number of runs
    return counts

def randomQuestion():
    print ("The question your team is getting asked is:")
    x = randint (1,4)
    if (x == 1): print("Color, color, color"); 
    if (x == 2): print("Color, shape, shape");
    if (x == 3): print("Shape, shape, color");
    if (x == 4): print("Shape, color, shape");
    return x;

def correctAnswer(x): # prints out the 
    print ("Copy the following code in the cell above:\n\n")
    if (x==1):
        print ("qc.h(q[0])\nqc.h(q[1])\nqc.h(q[2])")
    if (x==2):
        print ("qc.h(q[0])\nqc.sdg(q[1])\nqc.h(q[1])\nqc.sdg(q[2])\nqc.h(q[2])")
    if (x==3):
        print ("qc.sdg(q[0])\nqc.h(q[0])\nqc.sdg(q[1])\nqc.h(q[1])\nqc.h(q[2])")
    if (x==4):
        print ("qc.sdg(q[0])\nqc.h(q[0])\nqc.h(q[1])\nqc.sdg(q[2])\nqc.h(q[2])")


def circuitCheck(qc,q,c,x):
    counts = simulate(qc, q, c, 100)
    if (x==1): # ask all for color
        if (("000" in counts or "011" in counts or "101" in counts or "110" in counts) and ("001" not in counts and "010" not in counts and "100" not in counts and "111" not in counts)):
            print ("Perfect! Your team won!")
        else: print ("Hmmm... There might still be a mistake.")
    else:
        if (("001" in counts or "010" in counts or "100" in counts or "111" in counts) and ("000" not in counts and "011" not in counts and "101" not in counts and "110" not in counts)):
            print ("Perfect! Your team won!")
        else: print ("Hmmm... There might still be a mistake.")
            
def quiz():
    print ("(a) All 8 possible states equally mixed (|000>, |001>, |010>, ..., |110>, |111>)\n(b) A random distribution across all 8 states (|000>, |001>, |010>, ..., |110>, |111>)\n(c) Measurement result in 50% is state |000> and in 50% is state |100>\n(d) Measurement result in 50% is state |000> and in 50% is state |111>")
    answer = input()
    if answer == "d" or answer == "D":
        print ("Your answer was correct!")
    else: 
        print ("No, try again!")
  
