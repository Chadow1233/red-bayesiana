import express from "express";
import { red as redInicial } from "./red.js";
import { consultar, validarVariablesNecesarias } from "./consulta.js";
import { guardarRed, cargarRed } from "./almacenamiento.js";
import { Variable, RedBayesiana } from "./redBayesiana.js";

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
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
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
        const { variable, evidencia = {}, redLocal } = req.body;

        let redAUsar = red;

        // Si el cliente envía su red personalizada desde localStorage
        if (Array.isArray(redLocal) && redLocal.length > 0) {
            const tempRed = new RedBayesiana();

            // 1. Crear variables en una instancia temporal
            for (const dato of redLocal) {
                tempRed.agregarVariable(new Variable(dato.nombre, dato.estados));
            }

            // 2. Restaurar relaciones de parentesco
            for (const dato of redLocal) {
                const varObj = tempRed.obtenerVariable(dato.nombre);
                const padres = Array.isArray(dato.padres) ? dato.padres : [];
                for (const pNombre of padres) {
                    const nombrePadre = typeof pNombre === 'object' ? pNombre.nombre : pNombre;
                    const padreObj = tempRed.obtenerVariable(nombrePadre);
                    if (padreObj) varObj.agregarPadre(padreObj);
                }
            }

            // 3. Restaurar probabilidades
            for (const dato of redLocal) {
                const varObj = tempRed.obtenerVariable(dato.nombre);
                if (dato.probabilidades && Object.keys(dato.probabilidades).length > 0) {
                    varObj.agregarProbabilidades(dato.probabilidades);
                }
            }

            redAUsar = tempRed;
        }

        // Comprobar que la variable exista en la red a evaluar
        const variableExiste = redAUsar.obtenerVariable(variable);

        if (!variableExiste) {
            return res.status(400).json({
                error: "La variable consultada no existe."
            });
        }

        // Comprobar que la evidencia sea un objeto
        if (
            evidencia === null ||
            typeof evidencia !== "object" ||
            Array.isArray(evidencia)
        ) {
            return res.status(400).json({
                error: "La evidencia debe ser un objeto."
            });
        }

        // Validar las variables y estados de la evidencia
        for (const nombre in evidencia) {
            const variableEvidencia = redAUsar.obtenerVariable(nombre);

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

        // La variable consultada no puede ser evidencia
        if (Object.hasOwn(evidencia, variable)) {
            return res.status(400).json({
                error: "No puedes consultar una variable que también sea evidencia."
            });
        }

        // Validar y ejecutar el cálculo de eliminación de variables
        validarVariablesNecesarias(redAUsar, variable, evidencia);
        const resultado = consultar(redAUsar, variable, evidencia);

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

// Eliminar una relacion de la red
app.delete('/api/relaciones', (req, res) => {
  try {
    const { padre, hijo } = req.body;

    const variableHijo = red.obtenerVariable(hijo);
    if (!variableHijo) {
      return res.status(404).json({ error: `La variable "${hijo}" no existe.` });
    }

    // Remover el padre de la lista
    variableHijo.padres = variableHijo.padres.filter(p => p.nombre !== padre);

    // Persistir cambios
    guardarRed(red);

    res.json({ mensaje: 'Relación eliminada exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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