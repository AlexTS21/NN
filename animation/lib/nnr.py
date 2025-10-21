import numpy as np

class layerR:
    def __init__(self, n, type="input", act=None, mean=None, desv=None):
       
        self.act = np.empty(n)
        if type != "input":
            self.bias = np.empty(n)
            return
        if type == "hidden":
            activations = {
                "nom": lambda x: np.e#**(-fi(x, mean, desv, ))
            }
            
        
        pass


class nnr:
    def __init__(self):
        self.inputtL = layerR(1, type="input")
        self.hiddenL = "hola"
        self.outputL = "you"
        pass

    def forward(self, patron):

        pass

    def backpropagation(self, patron, salida):

        pass
