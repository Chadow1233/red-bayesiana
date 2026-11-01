import express from "express";
import { red as redInicial } from "./red.js";
import { consultar, validarVariablesNecesarias } from "./consulta.js";
import { guardarRed, cargarRed } from "./almacenamiento.js";
import { Variable } from "./redBayesiana.js";

const app = express();
const PUERTO = 3000;

let red;

// Cargar la red guardada.
try {
    red = cargarRed();

    if (red === null) {
        red = redInicial;
        console.log("No existe una red guardada. Se utilizará la red inicial.");
    } else {
        console.log("Red guardada cargada correctamente.");
    }

} catch (error) {
    console.error(error.message);
    process.exit(1);
}

// Permitir recibir información JSON.
app.use(express.json());


// =====================================
// OBTENER VARIABLES
// =====================================

app.get("/api/variables", (req, res) => {
    const variables = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre)
    }));

    res.json(variables);
});


// =====================================
// OBTENER TODA LA RED
// =====================================

app.get("/api/red", (req, res) => {
    const variables = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
    }));

    res.json({
        cantidad: variables.length,
        variables: variables
    });
});


// =====================================
// CONSULTAR PROBABILIDADES
// =====================================

app.post("/api/consultar", (req, res) => {
    try {
        const { variable, evidencia = {} } = req.body;

        // Comprobar que la variable exista.
        const variableExiste = red.obtenerVariable(variable);

        if (!variableExiste) {
            return res.status(400).json({
                error: "La variable consultada no existe."
            });
        }

        // Comprobar que la evidencia sea un objeto.
        if (
            evidencia === null ||
            typeof evidencia !== "object" ||
            Array.isArray(evidencia)
        ) {
            return res.status(400).json({
                error: "La evidencia debe ser un objeto."
            });
        }

        // Validar las variables y estados de la evidencia.
        for (const nombre in evidencia) {
            const variableEvidencia = red.obtenerVariable(nombre);

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

        // La variable consultada no puede ser evidencia.
        if (Object.hasOwn(evidencia, variable)) {
            return res.status(400).json({
                error: "No puedes consultar una variable que también sea evidencia."
            });
        }

        // Comprobar que las variables necesarias tengan probabilidades.
        validarVariablesNecesarias(red, variable, evidencia);

        // Ejecutar la eliminación de variables.
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


// =====================================
// CREAR UNA VARIABLE
// =====================================

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


// =====================================
// ASIGNAR PROBABILIDADES
// =====================================

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


// =====================================
// CREAR RELACIONES
// =====================================

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


// =====================================
// INICIAR SERVIDOR
// =====================================

app.listen(PUERTO, () => {
    console.log("Servidor iniciado en http://localhost:" + PUERTO);
});