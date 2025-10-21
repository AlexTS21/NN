document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('play-btn');
    playBtn.addEventListener('click', startAnimationT);
    // Initialize empty chart
    initializeChart();
});

let chart; // Store chart reference
let contador = 1;
let csvColumns = [];      // Global: stores header names
let csvDictionary = {};   // Global: stores the parsed dictionary
let XNames = []
let YNames = []
let biasG = []
let nCircles = []
let weights = []
document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);

function initializeChart() {
    const layout = {
        title: {
                text:'Error',
                font: {
                    color: '#f4f4f4' // color del título
                }
            },
        xaxis: {
            title: 'Epoca',
            dtick: 1,
            font: {
                    color: '#f4f4f4' 
            },
            tickfont: { color: '#f4f4f4' },     
            linecolor: '#f4f4f4',               
            gridcolor: '#f4f4f455',             
            zerolinecolor: '#f4f4f4',
        },
        yaxis: {
            title: 'Error',
            autorange: true,
            font: {
                color: '#f4f4f4' 
            },
            tickfont: { color: '#f4f4f4' },     
            linecolor: '#f4f4f4',               
            gridcolor: '#f4f4f455',             
            zerolinecolor: '#f4f4f4',
        },
        margin: {t: 30, b: 40, l: 50, r: 30},
        paper_bgcolor: '#1A1A1D',   // fondo general
        plot_bgcolor: '#1A1A1F',    // fondo del área de trazado
        autosize: true,
        height: window.innerHeight * 0.39
    };
    
    const data = [{
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: {color: '#cb6ce6', width: 2},
        marker: {size: 8}
    }];
    
    chart = Plotly.newPlot('chart-container', data, layout);
}


function agregarFila() {
    const tbody = document.querySelector('#cTable tbody');

    const fila = document.createElement('tr');
    fila.setAttribute('data-numero', contador); // identificador

    // Columna 1: contador
    const col1 = document.createElement('td');
    col1.textContent = contador++;

    // Columna 2: input
    const col2 = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    col2.appendChild(input);

    // Columna 3: select
    const col3 = document.createElement('td');
    const select = document.createElement('select');
    ['identidad', 'sigmoide', 'tanh', 'relu', 'leaky_relu'].forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.text = op;
        select.appendChild(option);
    });
    col3.appendChild(select);

    fila.appendChild(col1);
    fila.appendChild(col2);
    fila.appendChild(col3);

    tbody.appendChild(fila);
}

function borrarFila() {
    const numero = parseInt(document.getElementById('filaABorrar').value);
    if (isNaN(numero)) {
        alert("Ingresa un número válido.");
        return;
    }

    const filas = document.querySelectorAll('#cTable tbody tr');
    let eliminada = false;

    filas.forEach(fila => {
        if (parseInt(fila.getAttribute('data-numero')) === numero) {
            fila.remove();
            eliminada = true;
        }
    });

    if (!eliminada) {
        alert(`No se encontró la fila #${numero}`);
    }
}

function obtenerFuncionesOcultas() {
    const filas = document.querySelectorAll('#cTable tbody tr');
    const activaciones = [];

    filas.forEach(fila => {
        const select = fila.querySelector('select');
        if (select) {
            activaciones.push(select.value);
        }
    });

    return activaciones;
}

function obtenerCapasOcultas() {
    const tbody = document.querySelector('#cTable tbody');
    const filas = tbody.querySelectorAll('tr');
    const valores = [];

    filas.forEach(fila => {
        const input = fila.querySelector('input[type="number"]');
        if (input) {
            const valor = parseInt(input.value);
            // Verifica que el input no esté vacío y sea un número válido
            if (!isNaN(valor)) {
                valores.push(valor);
            } else {
                valores.push(null); // o puedes omitirlo o lanzar error según tu lógica
            }
        }
    });

    return valores;
}



function handleFileSelect(event) {
    const file = event.target.files[0];
    const label = document.getElementById('csvFIL');
    if (file) {
        const fileName = file.name;
        console.log("Selected file:", fileName);
        label.textContent = "FILE: "+ fileName;
        readCSVFile(file, (dictionary) => {
            csvDictionary = dictionary;             // Save dictionary globally
            csvColumns = Object.keys(dictionary);   // Save column headers globally
            console.log("Parsed CSV Dictionary:", csvDictionary);
            
        });
    }
}

function readCSVFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.trim().split('\n');

        const headers = lines[0].split(',').map(h => h.trim());
        const result = {};

        headers.forEach(header => {
            result[header] = [];
        });

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            headers.forEach((header, index) => {
                result[header].push(values[index]);
            });
        }

        callback(result);
    };
    reader.readAsText(file);
}

function checkData(){
    const input = document.getElementById('x-inp').value;
    const output = document.getElementById('y-inp').value;
    const aprendizaje = document.getElementById('aprendizaje').value;
    const test  = document.getElementById('test').value;
    const iterations = document.getElementById('iterations').value;
    if (csvColumns.length === 0) {
        showAlert("Please upload a CSV file first.", type="warning");
        return 1;
    }
    if (input.length === 0){
        showAlert("Please fill the X field", type="warning");
        return 1;
    }
    if (output.length === 0){
        showAlert("Please fill the Y field");
        return 1;
    }
    if (aprendizaje.length === 0){
         showAlert("Please fill the aprendizaje");
        return 1;
    }
    if (iterations.length === 0){
        showAlert("Please fill the iterations");
        return 1;
    }
    return 0;
}

async function inicializarRed(layers, activations) {
    // Crear red
    let res = await fetch('/crear_red/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({layers: layers, activations:activations})
    });
    let data = await res.json();
    //console.log("Red creada:", data);
    showAlert("Red creada", type='success')
}

function getX(){
    const X = [];
    for (let l =0; l< csvDictionary[XNames[0]].length; l++){
        const patron = [];
        for (n = 0; n<XNames.length; n++){
            patron.push(csvDictionary[XNames[n]][l])
        }
        X.push(patron)
    }
    return X;
}

function getS(){
    const S = [];
    for (let l =0; l< csvDictionary[YNames[0]].length; l++){
        const patron = [];
        for (n = 0; n<YNames.length; n++){
            patron.push(csvDictionary[YNames[n]][l])
        }
        S.push(patron)
    }
    return S;
}

async function startAnimationT() {
    const iterations = parseInt(document.getElementById('iterations').value);
    const playBtn = document.getElementById('play-btn');

    // Reset chart
    Plotly.purge('chart-container');
    initializeChart();

    // Disable button during animation
    playBtn.disabled = true;

    // Datos de csv
    const X = getX();
    const S = getS();
    //console.log(X)
    //console.log(S)
    // Iniciar animación
    await playTrainingSequence(X, S, iterations);

    playBtn.disabled = false;
}

async function playTrainingSequence(X, S, iterations) {
    const lr = document.getElementById('aprendizaje').value;
    for (let i = 1; i <= iterations; i++) {
        try {
            const res = await fetch('/entrenar_paso/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ X: X, S: S, leariningRate: lr })
            });

            const data = await res.json();
            console.log(data.pesos)
            console.log(weights)
            if (data.error_promedio !== undefined) {
                Plotly.extendTraces('chart-container', {
                    x: [[i]],
                    y: [[parseFloat(data.error_promedio)]]
                }, [0]);
                //Actualizar las act y colores
                for (let l =0; l<biasG.length; l++){
                    for(let n = 0; n< biasG[l].length; n++){
                        //console.log("capa " + l + "neurona " + n)
                        biasG[l][n].textContent = data.act[l][n].toFixed(2)
                        nCircles[l][n].setAttribute('fill', "rgb(76, " + data.colors[l][n] + ", 80)");
                        //agregar los pesos, aun no extraidos en variable global
                    }
                    if(l!= biasG.length-1){
                            for(let w =0; w<weights[l][0].length; w++){
                                //console.log("peso " + w)
                                weights[l][0][w].setAttribute('stroke-width', data.pesos[l][0][w]);
                            }
                        }
                }


                await new Promise(resolve => setTimeout(resolve, 400)); // delay para animación
            } else {
                console.error('Respuesta inválida:', data);
                break;
            }
        } catch (error) {
            console.error('Error en animación:', error);
            break;
        }
    }
}

function aply() {
    if(checkData() == 0){
        const input = document.getElementById('x-inp').value;
        const output = document.getElementById('y-inp').value;
        const requestedColumnsI = input.split(',').map(col => col.trim());
        const requestedColumnsO = output.split(',').map(col => col.trim());

        const missingI = requestedColumnsI.filter(col => !csvColumns.includes(col));
        const missingO = requestedColumnsO.filter(col => !csvColumns.includes(col));
        if (missingI.length === 0 && missingO.length === 0 ) {
            XNames = requestedColumnsI;
            YNames = requestedColumnsO;
            const layers = obtenerCapasOcultas()
            const activations =  obtenerFuncionesOcultas()
            activations.push('identidad')
            layers.unshift(requestedColumnsI.length)
            layers.push(requestedColumnsO.length)
            //Crear el dibujo de la red
            console.log(activations)
            drawNN('nn-svg', layers);
            //Crear la red 
            inicializarRed(layers, activations);
        } else {
            alert("These columns do not exist: " + missingI.join(', ') +   missingO.join(', '));
        }
    }else{
        return;
    }
    
}
//drawNN('nn-svg', [2,1,3, 5]);
function drawNN(containerId, neurons, radius = 20, spacingY = 50, strokeWith="1.5") {
    const svg = document.getElementById(containerId);
    const svgWidth = svg.clientWidth || svg.getBoundingClientRect().width;
    const svgHeight = svg.clientHeight || svg.getBoundingClientRect().height;
    const numLayers = neurons.length;
    const layerSpacing = svgWidth / (numLayers + 1);
    biasG = []
    weights = []
    nCircles =[]

    // Limpia el SVG
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    let anterior = []
    for (let l = 0; l < numLayers; l++) {
        const x = layerSpacing * (l + 1);
        const layerHeight = neurons[l] * spacingY;
        const offsetY = (svgHeight - layerHeight) / 2 + radius*1.5;
        let positions = []
        const biasC =[]
        const weight = []
        const nCirclesC =[]
        for (let n = 0; n < neurons[l]; n++) {
            const y = offsetY + n * spacingY;
            
            // Dibuja neurona (círculo)
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            positions.push([x,y])
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", "#4CAF50");
            svg.appendChild(circle);
            nCirclesC.push(circle);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "12");
            text.textContent = `n${n}`; // or any other label
            biasC.push(text);
            svg.appendChild(text);

            // Dibuja conexiones si no es la primera capa
            if (l >0) {
                const w = []
                //console.log(anterior)
                for (let j = 0; j < anterior.length; j++){
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", anterior[j][0]+radius);
                    line.setAttribute("y1", anterior[j][1]);
                    line.setAttribute("x2", x-radius);
                    line.setAttribute("y2", y);
                    line.setAttribute("stroke", "#151");
                    line.setAttribute("stroke-width", strokeWith);
                    w.push(line)
                    svg.appendChild(line);
                }
                weight.push(w)
            }
            
        }
        anterior = positions;
        biasG.push(biasC);
        nCircles.push(nCirclesC);
        if (l >0) {
            weights.push(weight)
        }
    }
}

function showAlert(message, type = 'info', duration = 3000) {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    container.appendChild(alert);

    // Desaparecer después de un tiempo
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, duration);
}


let isSecondSlideVisible = false;
function toggleSlides() {
    const wrapper = document.querySelector('#arch-cont .slide-wrapper');
    const button = document.querySelector('#left-controls button.ctr-btn:nth-child(5)'); // your rd button is "EVALUATE"
    
    isSecondSlideVisible = !isSecondSlideVisible;
    wrapper.style.transform = isSecondSlideVisible ? 'translateX(-50%)' : 'translateX(0)';
    
    button.textContent = isSecondSlideVisible ? 'LAYERS' : 'EVALUATE';
}