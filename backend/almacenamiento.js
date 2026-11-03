import fs from "node:fs";
import { Variable, RedBayesiana } from "./redBayesiana.js";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de archivos unificadas
const archivoTemporal = path.join(__dirname, "redGuardada.tmp.json");
const archivoFinal = path.join(__dirname, "redGuardada.json");

function guardarRed(red) {
    const datos = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
    }));

    fs.writeFileSync(
        archivoTemporal,
        JSON.stringify(datos, null, 4)
    );

    fs.renameSync(archivoTemporal, archivoFinal);
}

function cargarRed() {
    if (!fs.existsSync(archivoFinal)) {
        return null;
    }

    try {
        const datos = JSON.parse(
            fs.readFileSync(archivoFinal, "utf8")
        );

        if (!Array.isArray(datos)) {
            throw new Error("El archivo de la red debe contener un arreglo.");
        }

        for (const dato of datos) {
            if (
                !dato ||
                typeof dato.nombre !== "string" ||
                !Array.isArray(dato.estados) ||
                !Array.isArray(dato.padres) ||
                dato.padres.some(nombre => typeof nombre !== "string") ||
                !dato.probabilidades ||
                typeof dato.probabilidades !== "object" ||
                Array.isArray(dato.probabilidades)
            ) {
                throw new Error(
                    "El archivo contiene una variable con datos incompletos o inválidos."
                );
            }
        }

        const red = new RedBayesiana();

        for (const dato of datos) {
            const variable = new Variable(dato.nombre, dato.estados);
            red.agregarVariable(variable);
        }

        for (const dato of datos) {
            const variable = red.obtenerVariable(dato.nombre);

            for (const nombrePadre of dato.padres) {
                const padre = red.obtenerVariable(nombrePadre);

                if (!padre) {
                    throw new Error(
                        `No existe la variable padre "${nombrePadre}".`
                    );
                }

                variable.agregarPadre(padre);
            }
        }

        for (const dato of datos) {
            const variable = red.obtenerVariable(dato.nombre);

            if (Object.keys(dato.probabilidades).length > 0) {
                variable.agregarProbabilidades(dato.probabilidades);
            }
        }

        return red;

    } catch (error) {
        throw new Error(
            "No se pudo cargar la red guardada: " + error.message
        );
    }
}

export { guardarRed, cargarRed };