import express from "express";
import { red as redInicial } from "./red.js";
import { consultar } from "./consulta.js";
import { guardarRed, cargarRed } from "./almacenamiento.js";
import { Variable, RedBayesiana } from "./redBayesiana.js";

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
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
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

// Eliminar una variable de la red
app.delete("/api/variables/:nombre", (req, res) => {
    try {
        const { nombre } = req.params;
        const index = red.variables.findIndex(v => v.nombre === nombre);

        if (index === -1) {
            return res.status(404).json({ error: "La variable no existe." });
        }

        // Eliminar la variable de la lista
        red.variables.splice(index, 1);

        // Quitar la variable eliminada de las listas de padres de los demas nodos
        for (const variable of red.variables) {
            variable.padres = variable.padres.filter(p => p.nombre !== nombre);
        }

        guardarRed(red);
        res.json({ mensaje: `Variable "${nombre}" eliminada correctamente.` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Exportar la red a un objeto JSON
app.get("/api/exportar", (req, res) => {
    const datos = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
    }));
    res.json(datos);
});

// Importar una red desde un archivo JSON
app.post("/api/importar", (req, res) => {
    try {
        const datos = req.body;
        if (!Array.isArray(datos)) {
            return res.status(400).json({ error: "Formato JSON inválido. Debe ser una lista de variables." });
        }

        const nuevaRed = new RedBayesiana();

        // 1. Crear las variables
        for (const dato of datos) {
            nuevaRed.agregarVariable(new Variable(dato.nombre, dato.estados));
        }

        // 2. Restaurar relaciones de parentesco
        for (const dato of datos) {
            const variable = nuevaRed.obtenerVariable(dato.nombre);
            for (const nombrePadre of dato.padres) {
                const padre = nuevaRed.obtenerVariable(nombrePadre);
                if (padre) variable.agregarPadre(padre);
            }
        }

        // 3. Restaurar probabilidades
        for (const dato of datos) {
            const variable = nuevaRed.obtenerVariable(dato.nombre);
            if (dato.probabilidades && Object.keys(dato.probabilidades).length > 0) {
                variable.agregarProbabilidades(dato.probabilidades);
            }
        }

        red = nuevaRed;
        guardarRed(red);
        res.json({ mensaje: "Red importada correctamente" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Iniciar el servidor.
app.listen(PUERTO, () => {
    console.log("Servidor iniciado en http://localhost:" + PUERTO);
});
