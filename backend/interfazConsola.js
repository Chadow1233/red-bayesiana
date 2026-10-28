import { createInterface } from "node:readline";
import { consultar } from "./consulta.js";
import { red } from "./red.js";

function normalizarTexto(texto) {
    return texto
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

const entrada = createInterface({
    input: process.stdin,
    output: process.stdout
});

function preguntar(texto) {
    return new Promise(resolve => {
        entrada.question(texto, resolve);
    });
}

async function iniciar() {
    console.log("Variables disponibles:");

    for (const variable of red.variables) {
        console.log("- " + variable.nombre);
    }

    const nombreConsulta = await preguntar(
        "\n¿Qué variable quieres consultar? "
    );

    const variableConsulta = red.variables.find(
        variable =>
            normalizarTexto(variable.nombre) ===
            normalizarTexto(nombreConsulta)
    );

    if (!variableConsulta) {
        console.log("Esa variable no existe en la red.");
        entrada.close();
        return;
    }

    const evidencia = {};

    while (true) {
        const respuesta = await preguntar(
            "\n¿Quieres agregar una evidencia? (sí/no) "
        );

        const respuestaNormalizada = normalizarTexto(respuesta);

        if (respuestaNormalizada === "no") {
            break;
        }

        if (respuestaNormalizada !== "si") {
            console.log("Escribe sí o no.");
            continue;
        }

        const nombreEvidencia = await preguntar(
            "¿Qué variable conoces? "
        );

        const variableEvidencia = red.variables.find(
            variable =>
                normalizarTexto(variable.nombre) ===
                normalizarTexto(nombreEvidencia)
        );

        if (!variableEvidencia) {
            console.log("Esa variable no existe en la red.");
            continue;
        }

        if (
            variableEvidencia.nombre === variableConsulta.nombre ||
            variableEvidencia.nombre in evidencia
        ) {
            console.log(
                "Esa variable ya es la variable consultada o ya tiene evidencia."
            );
            continue;
        }

        const estado = await preguntar("¿Qué estado tiene? ");

        const estadoEncontrado = variableEvidencia.estados.find(
            estadoValido =>
                normalizarTexto(estadoValido) === normalizarTexto(estado)
        );

        if (estadoEncontrado === undefined) {
            console.log("Ese estado no existe para la variable.");
            continue;
        }

        evidencia[variableEvidencia.nombre] = estadoEncontrado;

        console.log(
            "Evidencia agregada: " +
            variableEvidencia.nombre +
            " = " +
            estadoEncontrado
        );
    }

    consultar(red, variableConsulta.nombre, evidencia);

    entrada.close();
}

iniciar();