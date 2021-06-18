import hello_quantum

exercises = [
    {
        'initialize': [],
        'success_condition': {},
        'allowed_gates': {'0': {'x': 3}, '1': {}, 'both': {}},
        'vi': [[1], True, False],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['h','0']],
        'success_condition': {},
        'allowed_gates': {'0': {'h': 3}, '1': {}, 'both': {}},
        'vi': [[1], True, False],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['x','0'],['h','0']],
        'success_condition': {},
        'allowed_gates': {'0': {'ry(pi/4)': 4}, '1': {}, 'both': {}},
        'vi': [[1], True, False],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['x','0'],['h','0']],
        'success_condition': {},
        'allowed_gates': {'0': {'bloch':0, 'ry(pi/4)': 4}, '1': {}, 'both': {}},
        'vi': [[1], True, False],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['x','0'],['h','0']],
        'success_condition': {},
        'allowed_gates': {'1': {'bloch':0,'x':2,'h':2,'ry(pi/4)': 2}, '0': {}, 'both': {}},
        'vi': [[0], True, False],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['x','0']],
        'success_condition': {'XX':1},
        'allowed_gates': {'0': {'bloch':0,'x':0,'h':0,'ry(pi/4)': 0}, '1': {'bloch':0,'x':0,'h':0,'ry(pi/4)': 0}, 'both': {}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['ry(-pi/4)','1']],
        'success_condition': {},
        'allowed_gates': {'0': {'x': 3}, '1': {}, 'both': {}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['ry(-pi/4)','1']],
        'success_condition': {},
        'allowed_gates': {'0': {'h': 3}, '1': {}, 'both': {}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [],
        'success_condition': {'ZI':-1, 'IZ':-1},
        'allowed_gates': {'0': {'bloch':0,'ry(pi/4)': 0}, '1': {'bloch':0,'ry(pi/4)': 0}, 'both': {}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['h','0'],['h','1']],
        'success_condition': {},
        'allowed_gates': {'0': {}, '1': {}, 'both': {'cz':3}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [['h','0'],['h','1']],
        'success_condition': {},
        'allowed_gates': {'0': {}, '1': {}, 'both': {'cz':3}},
        'vi': [[], True, True],
        'mode': 'y',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [],
        'success_condition': {'ZZ':2},
        'allowed_gates': {'0': {'bloch':0, 'x':0, 'h':0, 'cz':0, 'ry(pi/4)': 0}, '1': {'bloch':0, 'x':0, 'h':0, 'cz':0, 'ry(pi/4)': 0}, 'both': {'cz':0}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'q[0]', '1':'q[1]'}
    },
    {
        'initialize': [],
        'success_condition': {'ZZ':+0.7071,'ZX':+0.7071,'XZ':+0.7071,'XX':-0.7071},
        'allowed_gates': {'0': {'bloch':0, 'x':0, 'h':0, 'cz':0, 'ry(pi/4)': 0}, '1': {'bloch':0, 'x':0, 'h':0, 'cz':0, 'ry(pi/4)': 0}, 'both': {'cz':0}},
        'vi': [[], True, True],
        'mode': 'line',
        'qubit_names': {'0':'A', '1':'B'}
    }
]
    
    
def run_puzzle(j):
    puzzle = hello_quantum.run_game(exercises[j]['initialize'],
                           exercises[j]['success_condition'],
                           exercises[j]['allowed_gates'],
                           exercises[j]['vi'],
                           qubit_names=exercises[j]['qubit_names'],
                           mode=exercises[j]['mode']
                          )
    return puzzle