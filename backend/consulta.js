import { crearFactor } from "./factores.js";

function validarVariablesNecesarias(red, variableConsulta, evidencia) {
    const necesarias = new Set();

    function agregarAntecesoras(variable) {
        if (necesarias.has(variable)) {
            return;
        }

        necesarias.add(variable);

        for (const padre of variable.padres) {
            agregarAntecesoras(padre);
        }
    }

    agregarAntecesoras(red.obtenerVariable(variableConsulta));

    for (const nombre in evidencia) {
        agregarAntecesoras(red.obtenerVariable(nombre));
    }

    for (const variable of necesarias) {
        if (
            !variable.probabilidades ||
            Object.keys(variable.probabilidades).length === 0
        ) {
            throw new Error(
                `La variable "${variable.nombre}" todavía no tiene probabilidades asignadas.`
            );
        }
    }
}


function consultar(red, variableConsulta, evidencia) {
    const factores = [];

// 1. Crear factores solo para variables con probabilidades asignadas.
for (const variable of red.variables) {
    if (
        variable.probabilidades &&
        Object.keys(variable.probabilidades).length > 0
    ) {
        const factor = crearFactor(variable);
        factores.push(factor);
    }
}

    // 2. Aplicar la evidencia
    for (const variable in evidencia) {
        for (let posicion = 0; posicion < factores.length; posicion++) {
            if (factores[posicion].variables.includes(variable)) {
                factores[posicion] = factores[posicion].observar(
                    variable,
                    evidencia[variable]
                );
            }
        }
    }

    // 3. Eliminar las variables que no necesitamos
    for (const variable of red.variables) {
        const nombre = variable.nombre;

        if (
            nombre !== variableConsulta &&
            !(nombre in evidencia)
        ) {
            let factorConjunto = null;
            const otrosFactores = [];

            for (const factor of factores) {
                if (factor.variables.includes(nombre)) {
                    if (factorConjunto === null) {
                        factorConjunto = factor;
                    } else {
                        factorConjunto = factorConjunto.multiplicar(factor);
                    }
                } else {
                    otrosFactores.push(factor);
                }
            }

            if (factorConjunto !== null) {
                const factorReducido = factorConjunto.sumarVariable(nombre);
                otrosFactores.push(factorReducido);
            }

            factores.length = 0;
            factores.push(...otrosFactores);
        }
    }

    // 4. Multiplicar los factores restantes
    let resultado = factores[0];

    for (let posicion = 1; posicion < factores.length; posicion++) {
        resultado = resultado.multiplicar(factores[posicion]);
    }

   
// 5. Eliminar del resultado las variables observadas
// que no sean la variable de consulta
for (const variable in evidencia) {
    if (
        variable !== variableConsulta &&
        resultado.variables.includes(variable)
    ) {
        resultado = resultado.sumarVariable(variable);
    }
}

// 6. Normalizar el resultado
resultado = resultado.normalizar();

console.log("Probabilidades finales:");
console.dir(resultado, { depth: null });

return resultado;

}

export { consultar };
