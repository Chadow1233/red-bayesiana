import express from "express";
import { red as redInicial } from "./red.js";
import { consultar } from "./consulta.js";
import { guardarRed, cargarRed } from "./almacenamiento.js";
import { Variable } from "./redBayesiana.js";

const app = express();
const PUERTO = 3000;
let red = cargarRed() || redInicial;

// Permite recibir información en formato JSON.
app.use(express.json());

// Obtener las variables de la red.
app.get("/api/variables", (req, res) => {
    const variables = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre)
    }));

    res.json(variables);
});

// Consultar probabilidades.
app.post("/api/consultar", (req, res) => {
    const { variable, evidencia = {} } = req.body;

    const variableExiste = red.variables.some(
        elemento => elemento.nombre === variable
    );

    if (!variableExiste) {
        return res.status(400).json({
            error: "La variable consultada no existe."
        });
    }

    if (
        evidencia === null ||
        typeof evidencia !== "object" ||
        Array.isArray(evidencia)
    ) {
        return res.status(400).json({
            error: "La evidencia debe ser un objeto."
        });
    }

    for (const nombre in evidencia) {
        const variableEvidencia = red.variables.find(
            elemento => elemento.nombre === nombre
        );

        if (!variableEvidencia) {
            return res.status(400).json({
                error: "La variable de evidencia no existe: " + nombre
            });
        }

        if (!variableEvidencia.estados.includes(evidencia[nombre])) {
            return res.status(400).json({
                error: "Estado inválido para la variable: " + nombre
            });
        }
    }

    if (Object.hasOwn(evidencia, variable)) {
        return res.status(400).json({
            error: "No puedes consultar una variable que también sea evidencia."
        });
    }

    // Buscar las variables necesarias para la consulta.
const variablesNecesarias = new Set();

function agregarAntecesoras(elemento) {
    if (variablesNecesarias.has(elemento)) {
        return;
    }

    variablesNecesarias.add(elemento);

    for (const padre of elemento.padres) {
        agregarAntecesoras(padre);
    }
}

// Incluir la variable consultada.
agregarAntecesoras(red.obtenerVariable(variable));

// Incluir las variables de evidencia y sus antecesoras.
for (const nombre in evidencia) {
    agregarAntecesoras(red.obtenerVariable(nombre));
}

// Comprobar que todas las variables necesarias tengan probabilidades.
const variableSinProbabilidades = [...variablesNecesarias].find(
    elemento =>
        !elemento.probabilidades ||
        Object.keys(elemento.probabilidades).length === 0
);

if (variableSinProbabilidades) {
    return res.status(400).json({
        error: `La variable "${variableSinProbabilidades.nombre}" todavía no tiene probabilidades asignadas.`
    });
}

    try {
        const resultado = consultar(red, variable, evidencia);

        res.json({
            variable: variable,
            evidencia: evidencia,
            probabilidades: resultado.tabla
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

// Crear una variable.
app.post("/api/variables", (req, res) => {
    try {
        const { nombre, estados } = req.body;

        const variable = new Variable(nombre, estados);

        red.agregarVariable(variable);
        guardarRed(red);

        res.status(201).json({
            mensaje: "Variable creada correctamente",
            variable: {
                nombre: variable.nombre,
                estados: variable.estados,
                padres: []
            }
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

    
// Asignar probabilidades a una variable.
app.post("/api/probabilidades", (req, res) => {
    try {
        const { nombre, probabilidades } = req.body;

        const variable = red.obtenerVariable(nombre);

        if (!variable) {
            return res.status(404).json({
                error: "La variable no existe."
            });
        }

        variable.agregarProbabilidades(probabilidades);
        guardarRed(red);

        res.status(200).json({
            mensaje: "Probabilidades asignadas correctamente",
            variable: variable.nombre,
            probabilidades: variable.probabilidades
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});


// Crear una relación entre dos variables.
app.post("/api/relaciones", (req, res) => {
    try {
        const { padre, hijo } = req.body;

        const variablePadre = red.obtenerVariable(padre);
        const variableHijo = red.obtenerVariable(hijo);

        if (!variablePadre || !variableHijo) {
            return res.status(404).json({
                error: "La variable padre o hijo no existe."
            });
        }

        variableHijo.agregarPadre(variablePadre);
        guardarRed(red);

        res.status(201).json({
            mensaje: "Relación creada correctamente",
            padre: variablePadre.nombre,
            hijo: variableHijo.nombre
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

// Iniciar el servidor.
app.listen(PUERTO, () => {
    console.log("Servidor iniciado en http://localhost:" + PUERTO);
});
