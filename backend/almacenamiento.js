import fs from "node:fs";
import { Variable, RedBayesiana } from "./redBayesiana.js";

function guardarRed(red) {
    const datos = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
    }));

    const archivoTemporal = "./backend/redGuardada.tmp.json";
    const archivoFinal = "./backend/redGuardada.json";

    fs.writeFileSync(
        archivoTemporal,
        JSON.stringify(datos, null, 4)
    );

    fs.renameSync(archivoTemporal, archivoFinal);
}


function cargarRed() {
    if (!fs.existsSync("./backend/redGuardada.json")) {
        return null;
    }

    try {
        const datos = JSON.parse(
            fs.readFileSync("./backend/redGuardada.json", "utf8")
        );

        // Comprobar que sea un arreglo.
        if (!Array.isArray(datos)) {
            throw new Error("El archivo de la red debe contener un arreglo.");
        }

        // Comprobar que cada variable tenga datos válidos.
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

        // Crear la red.
        const red = new RedBayesiana();

        // Crear todas las variables.
        for (const dato of datos) {
            const variable = new Variable(dato.nombre, dato.estados);
            red.agregarVariable(variable);
        }

        // Reconstruir las relaciones.
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

        // Restaurar las probabilidades.
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