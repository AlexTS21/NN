from django.shortcuts import render
from django.http import JsonResponse
import random
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import numpy as np
from .layer import nn
from .layer import layer
from .red_store import redes_por_usuario

def index(request):
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            iterations = int(request.POST.get('iterations', 10))
            sequence = []
            chart_data = []  # New data for the chart
            
            for i in range(iterations):
                thickness = random.randint(1, 20)
                green_shade = random.randint(100, 255)
                random_value = random.uniform(0, 1)  # New random value for chart
                
                sequence.append({
                    'thickness': thickness,
                    'color': f"rgb(76, {green_shade}, 80)",
                    'iteration': i+1,
                    'random_value': random_value  # Add to sequence
                })
                
                chart_data.append({
                    'iteration': i+1,
                    'value': random_value
                })
            
            return JsonResponse({
                'sequence': sequence,
                'chart_data': chart_data,  # Include chart data in response
                'status': 'success'
            })
        
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return render(request, 'animation/index.html')



def obtener_usuario_id(request):
    return request.session.session_key or request.META.get("REMOTE_ADDR")


@csrf_exempt
def crear_red(request):
    if request.method != "POST":
        return JsonResponse({"error": "Solo POST permitido"}, status=405)

    try:
        data = json.loads(request.body)
        layers = data.get("layers")  # Ej: [2, 3, 1]
        activations = data.get("activations") 
    except:
        return JsonResponse({"error": "Datos inválidos"}, status=400)

    if not layers or not isinstance(layers, list):
        return JsonResponse({"error": "Debes proporcionar una lista 'layers'"}, status=400)

    # Crear red
    red = nn(layers, activations)

    # Guardar por ID de usuario
    usuario_id = obtener_usuario_id(request)
    redes_por_usuario[usuario_id] = red

    return JsonResponse({"status": "Red creada", "layers": layers})

@csrf_exempt
def entrenar_paso(request):
    usuario_id = obtener_usuario_id(request)
    nn = redes_por_usuario.get(usuario_id)

    if nn is None:
        return JsonResponse({"error": "Primero debes crear la red"}, status=400)

    if request.method != "POST":
        return JsonResponse({"error": "Solo POST permitido"}, status=405)

    try:
        data = json.loads(request.body)
        X_list = data.get("X")  # Espera lista de listas, ejemplo: [[0,0],[1,0],...]
        S_list = data.get("S")  # Espera lista de listas o valores, ejemplo: [[0],[1],...]
        lr = data.get("leariningRate")
    except Exception as e:
        return JsonResponse({"error": f"Datos inválidos: {str(e)}"}, status=400)

    if not X_list or not S_list:
        return JsonResponse({"error": "Debes enviar X y S"}, status=400)

    # Convertir a numpy arrays
    X = np.array(X_list, dtype=float)
    S = np.array(S_list, dtype=float)
    errores = []
    for x, s in zip(X, S):
        print(nn.forward(x))
        err = nn.backPropagation(s, learningRate=float(lr))
        #print(f'peso {nn.layers[0].weights} bias {nn.layers[-1].bias}')
        print(f'act1: {nn.layers[0].act} act2: {nn.layers[-1].act}')
        errores.append(err)

    error_promedio = sum(errores) / len(errores)
    act = []
    matrices=[]
    for c in range(len(nn.layers)):
        act.append(nn.layers[c].act)
        if c != len(nn.layers)-1:
            matrices.append(nn.layers[c].weights.T)

    #gradiente de colores

    todos = np.concatenate(act)
    min_val = todos.min()
    max_val = todos.max()

    # Normalizamos cada array individualmente al rango [100, 255]
    if  max_val != min_val:
        normalizados = [
            100 + (arr - min_val) * (155 / (max_val - min_val))
            for arr in act
        ]

    # Si los quieres como listas de listas:
    colors = [arr.tolist() for arr in normalizados]
    print(colors)
    

    #Extraer pesos y normlaizarlos 

    # Unir todo en un solo array plano para calcular min y max
    valores = np.concatenate([m.flatten() for m in matrices])
    vmin = valores.min()
    vmax = valores.max()
    # Aplicar a cada matriz
    pesos = [normalizar_global(m, vmin, vmax).tolist() for m in matrices]
    return JsonResponse({
        "error_promedio": error_promedio,
        "pesos": pesos,
        "act": [b.tolist() for b in act],
        "colors": colors,
    })

def normalizar_global(m, vmax, vmin):
    if vmax == vmin:
        return np.full_like(m, 7.0  )
    return 1 + (m - vmin) * (6 / (vmax - vmin))


