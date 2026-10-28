class Factor {
    constructor(variables, tabla) {
        this.variables = variables;
        this.tabla = tabla;
    }

    multiplicar(otroFactor) {
        const variablesResultado = [
    ...new Set([...this.variables, ...otroFactor.variables])
];
    

        const tablaResultado = [];

        for (const fila1 of this.tabla) {
            for (const fila2 of otroFactor.tabla) {
                let compatibles = true;

                for (const variable of this.variables) {
                    if (
                        otroFactor.variables.includes(variable) &&
                        fila1[variable] !== fila2[variable]
                    ) {
                        compatibles = false;
                    }
                }

                if (compatibles) {
                    const nuevaFila = {};

                    for (const variable of variablesResultado) {
                        if (fila1[variable] !== undefined) {
                            nuevaFila[variable] = fila1[variable];
                        } else {
                            nuevaFila[variable] = fila2[variable];
                        }
                    }

                    nuevaFila.probabilidad =
                        fila1.probabilidad * fila2.probabilidad;

                    tablaResultado.push(nuevaFila);
                }
            }
        }

        return new Factor(variablesResultado, tablaResultado);
    }
    sumarVariable(nombreVariable) {
    const variablesResultado = this.variables.filter(
        variable => variable !== nombreVariable
    );

    if (!this.variables.includes(nombreVariable)) {
    throw new Error(
        `La variable "${nombreVariable}" no existe en este factor.`
    );
}
    const tablaResultado = [];

    for (const fila of this.tabla) {
        const nuevaFila = {};

        for (const variable of variablesResultado) {
            nuevaFila[variable] = fila[variable];
        }

        const filaExistente = tablaResultado.find(
            resultado =>
                variablesResultado.every(
                    variable => resultado[variable] === fila[variable]
                )
        );

        if (filaExistente) {
            filaExistente.probabilidad += fila.probabilidad;
        } else {
            nuevaFila.probabilidad = fila.probabilidad;
            tablaResultado.push(nuevaFila);
        }
    }

    return new Factor(variablesResultado, tablaResultado);
}

    observar(nombreVariable, estado) {
    if (!this.variables.includes(nombreVariable)) {
        throw new Error(
            `La variable "${nombreVariable}" no existe en este factor.`
        );
    }

    const estadosDisponibles = new Set(
        this.tabla.map(fila => fila[nombreVariable])
    );

    if (!estadosDisponibles.has(estado)) {
        throw new Error(
            `El estado "${estado}" no existe para la variable "${nombreVariable}" en este factor.`
        );
    }

    const tablaResultado = [];

    for (const fila of this.tabla) {
        if (fila[nombreVariable] === estado) {
            tablaResultado.push(fila);
        }
    }

    return new Factor(this.variables, tablaResultado);
}
normalizar() {
    let suma = 0;

    for (const fila of this.tabla) {
        suma += fila.probabilidad;
    }

    if (!Number.isFinite(suma) || suma <= 0) {
        throw new Error(
            "No se puede normalizar: la suma de probabilidades debe ser mayor que cero."
        );
    }

    const tablaResultado = [];

    for (const fila of this.tabla) {
        const nuevaFila = { ...fila };

        nuevaFila.probabilidad = fila.probabilidad / suma;

        tablaResultado.push(nuevaFila);
    }

    return new Factor(this.variables, tablaResultado);
}

}

function crearFactor(variable) {
    const tabla = [];
    const variablesFactor = [];

    // Agregar los padres
    for (const padre of variable.padres) {
        variablesFactor.push(padre.nombre);
    }

    // Agregar la variable
    variablesFactor.push(variable.nombre);

    // Crear las combinaciones de estados
    function crearFilas(posicion, fila) {
        if (posicion === variablesFactor.length) {
            const nuevaFila = { ...fila };

            let probabilidades = variable.probabilidades;

            // Buscar la probabilidad según los estados de los padres
            for (const padre of variable.padres) {
                probabilidades = probabilidades[nuevaFila[padre.nombre]];
            }

            // Obtener la probabilidad del estado de la variable
            nuevaFila.probabilidad =
                probabilidades[nuevaFila[variable.nombre]];

            tabla.push(nuevaFila);
            return;
        }

        const nombre = variablesFactor[posicion];
        let estados;

        if (nombre === variable.nombre) {
            estados = variable.estados;
        } else {
            const padre = variable.padres.find(
                padre => padre.nombre === nombre
            );

            estados = padre.estados;
        }

        for (const estado of estados) {
            fila[nombre] = estado;
            crearFilas(posicion + 1, fila);
        }

        delete fila[nombre];
    }

    crearFilas(0, {});

    return new Factor(variablesFactor, tabla);
}


export { Factor, crearFactor };