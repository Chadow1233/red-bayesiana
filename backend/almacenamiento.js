import fs from "node:fs";
import { Variable, RedBayesiana } from "./redBayesiana.js";

function guardarRed(red) {
    const datos = red.variables.map(variable => ({
        nombre: variable.nombre,
        estados: variable.estados,
        padres: variable.padres.map(padre => padre.nombre),
        probabilidades: variable.probabilidades
    }));

    fs.writeFileSync(
        "./backend/redGuardada.json",
        JSON.stringify(datos, null, 4)
    );
}

function cargarRed() {
    if (!fs.existsSync("./backend/redGuardada.json")) {
        return null;
    }

    const datos = JSON.parse(
        fs.readFileSync("./backend/redGuardada.json", "utf8")
    );

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
            variable.agregarPadre(padre);
        }
    }

    // Restaurar las probabilidades.
    // Restaurar las probabilidades cuando existan.
for (const dato of datos) {
    const variable = red.obtenerVariable(dato.nombre);

    if (
        dato.probabilidades &&
        Object.keys(dato.probabilidades).length > 0
    ) {
        variable.agregarProbabilidades(dato.probabilidades);
    }
}
       return red;
}

export { guardarRed, cargarRed };

