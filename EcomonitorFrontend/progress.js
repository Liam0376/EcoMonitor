/* ================================================
   UTILIDAD GENERAL
================================================ */

function animateValue(element, start, end, duration) {
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = start + (end - start) * progress;

        element.textContent = value.toFixed(0) + "%";

        if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function setColorBasedOnValue(element, value) {
    if (value < 40) {
        element.style.color = "#2ecc71"; // verde
    } else if (value < 75) {
        element.style.color = "#f1c40f"; // amarillo
    } else {
        element.style.color = "#e74c3c"; // rojo
    }
}

/* ================================================
   CIRCULAR PROGRESS PRINCIPAL
================================================ */

async function cargarConsumoHoy() {
    try {
        const res = await fetch("http://localhost:3000/api/consumo/hoy");
        const data = await res.json();

        const consumo = data.TotalHoy || 0;
        const maximo = 10;
        let porcentaje = Math.min((consumo / maximo) * 100, 100);

        const circle = document.querySelector(".progress-ring__circle");
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;

        circle.style.strokeDasharray = circumference;
        const offset = circumference - (porcentaje / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        const valueEl = document.getElementById("progress-value");

        valueEl.textContent = porcentaje.toFixed(0) + "%";

        setColorBasedOnValue(valueEl, porcentaje);

        // Actualizar tarjeta "Consumo hoy"
        document.getElementById("consumo-hoy").textContent =
            consumo.toFixed(2) + " kWh";

    } catch (err) {
        console.error("Error al cargar consumo de hoy:", err);
    }
}

/* ================================================
   MINI ANILLOS SEMANALES
================================================ */

async function cargarConsumoSemana() {
    try {
        const res = await fetch("http://localhost:3000/api/consumo/semana");
        const data = await res.json();

        const dias = document.querySelectorAll(".weekly-progress .day");

        data.forEach((item, index) => {
            const totalDia = item.TotalDia || 0;
            const porcentaje = Math.min((totalDia / 10) * 100, 100);

            const ring = dias[index].querySelector(".mini-fill");
            const radius = ring.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            ring.style.strokeDasharray = circumference;
            ring.style.strokeDashoffset =
                circumference - (porcentaje / 100) * circumference;

            // Cambiar colores según nivel
            if (porcentaje < 40) {
                ring.style.stroke = "#2ecc71";
            } else if (porcentaje < 75) {
                ring.style.stroke = "#f1c40f";
            } else {
                ring.style.stroke = "#e74c3c";
            }
        });

    } catch (err) {
        console.error("Error al cargar semana:", err);
    }
}

/* ================================================
   CONSUMO MENSUAL + CO₂
================================================ */

async function cargarConsumoMensual() {
    try {
        const res = await fetch("http://localhost:3000/api/consumo/mensual");
        const data = await res.json();

        const consumoMensual = data.TotalMes || 0;

        document.getElementById("consumo-mes").textContent =
            consumoMensual.toFixed(2) + " kWh";

        const co2 = consumoMensual * 0.0189;
        document.getElementById("co2-evitado").textContent =
            co2.toFixed(2) + " kg";

    } catch (err) {
        console.error("Error consumo mensual:", err);
    }
}

/* ================================================
   AHORRO ESTIMADO
================================================ */

async function cargarAhorro() {
    try {
        const res = await fetch("http://localhost:3000/api/consumo/hoy");
        const data = await res.json();

        const hoy = data.TotalHoy || 0;
        const maximo = 10;

        let ahorro = Math.max(0, (1 - hoy / maximo) * 100);

        const ahorroElement = document.getElementById("ahorro");
        ahorroElement.textContent = ahorro.toFixed(0) + "%";

        if (ahorro > 60) ahorroElement.style.color = "#2ecc71";
        else if (ahorro > 30) ahorroElement.style.color = "#f1c40f";
        else ahorroElement.style.color = "#e74c3c";

    } catch (err) {
        console.error("Error ahorro:", err);
    }
}

/* ================================================
   NAVEGACIÓN ENTRE PANTALLAS
================================================ */

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".tab-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const screenId = btn.getAttribute("data-screen");

        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });

        document.getElementById(screenId).classList.add("active");
    });
});

/* ================================================
   INICIALIZACIÓN GENERAL
================================================ */

cargarConsumoHoy();
cargarConsumoSemana();
cargarConsumoMensual();
cargarAhorro();


/* ================================================
   INICIALIZACIÓN GENERAL
================================================ */

cargarConsumoHoy();
cargarConsumoSemana();
cargarConsumoMensual();
cargarAhorro();

/* ================================================
   ACTUALIZACIÓN AUTOMÁTICA
================================================ */

setInterval(() => {
    cargarConsumoHoy();
    cargarConsumoSemana();
    cargarConsumoMensual();
    cargarAhorro();
    actualizarGraficaSemanal();


}, 4000);

/* =========================================================
   GRÁFICA SEMANAL - VERSION PREMIUM
========================================================= */
let weeklyChart = null;

async function actualizarGraficaSemanal() {
    const res = await fetch("http://localhost:3000/api/consumo/semana");
    const data = await res.json();

    // Formato elegante: "23 nov"
    const labels = data.map(d => {
        const fecha = new Date(d.Dia);
        return fecha.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short"
        });
    });

    const valores = data.map(d => d.TotalDia);

    const ctx = document.getElementById("weeklyChart").getContext("2d");

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Consumo (kWh)",
                data: valores,
                fill: true,
                backgroundColor: "rgba(242, 140, 40, 0.15)",
                borderColor: "#f28c28",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: "#f28c28",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 12,
                            family: "Poppins"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(0,0,0,0.85)",
                    titleFont: { size: 13, family: "Poppins" },
                    bodyFont: { size: 12, family: "Poppins" },
                    padding: 10,
                    cornerRadius: 6
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: 11, family: "Poppins" },
                        color: "#555",
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        font: { size: 11, family: "Poppins" },
                        color: "#777"
                    },
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    }
                }
            },
            animation: {
                duration: 800,
                easing: "easeOutQuart"
            }
        }
    });
}


/* =========================================================
   CONTROL ON/OFF DE DISPOSITIVOS
========================================================= */
document.querySelectorAll(".power-btn").forEach((btn, index) => {
    let estado = 0;

    btn.addEventListener("click", async () => {
        estado = estado === 0 ? 1 : 0;

        btn.classList.toggle("active");

        await fetch("http://localhost:3000/api/dispositivos/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idDispositivo: index + 1,
                nuevoEstado: estado
            })
        });
    });
});

/* =============================
   CHATBOT FLOTANTE
============================== */
const chatBtn = document.getElementById("chatbot-btn");
const chatWindow = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

let chatOpen = false;

// Abrir / cerrar chat
chatBtn.addEventListener("click", () => {
    chatOpen = !chatOpen;
    chatWindow.style.display = chatOpen ? "flex" : "none";
});

// Funciones
function addMessage(text, type) {
    const div = document.createElement("div");
    div.classList.add("msg", type === "user" ? "user-msg" : "bot-msg");
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ===========================================
   ENVÍO DE MENSAJES DEL CHATBOT
=========================================== */

function enviarMensaje() {
    const texto = chatInput.value.trim();
    if (texto === "") return;

    // Mensaje del usuario
    addMessage(texto, "user");
    chatInput.value = "";

    // Respuesta de la IA
    botReply(texto);
}

// Botón enviar
chatSend.addEventListener("click", enviarMensaje);

// Enviar con ENTER
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensaje();
});


/* ============================================================
   CHATBOT IA-LITE — INTELIGENCIA ARTIFICIAL FAKE
============================================================ */

async function botReply(texto) {
    const msg = texto.toLowerCase().trim();

    // ==== 1. INTENCIONES ====
    const esSaludo = /(hola|hi|buenas|qué onda|que onda|hey)/.test(msg);
    const esHoy = /(hoy|consumo hoy|gasto hoy)/.test(msg);
    const esSemana = /(semana|semanal)/.test(msg);
    const esDispositivo = /(dispositivo|equipo|aparato|gasta más|más gasto)/.test(msg);
    const esConsejo = /(consejo|ahorro|cómo puedo ahorrar|tips)/.test(msg);
    const esAlerta = /(alto|mucho|sobrecarga|peligro|riesgo)/.test(msg);

    // ==== 2. RESPUESTAS VARIADAS ====
    const respuestas = {
        saludo: [
            "Ey, qué tal ⚡. Aquí estoy monitoreando tus kilowatts como un guardián digital.",
            "Hola. El consumo fluye, yo también.",
            "Buenas. A ver… qué quieres que revisemos."
        ],
        hoy: [
            datos => `Hoy llevas **${datos} kWh**. Suave, como una casa en calma.`,
            datos => `El contador marca **${datos} kWh** hoy. Nada fuera de lo normal.`,
            datos => `Tus cables respiraron **${datos} kWh** en lo que va del día.`
        ],
        semana: [
            "Tu resumen semanal está arriba, moviéndose como olas en la gráfica 📊.",
            "La semana ha sido estable. Nada sobrecargado.",
            "Si quieres te explico la gráfica, aunque es más fácil verla que contarla."
        ],
        dispositivo: [
            nombre => `El dispositivo que más gasta ahora es **${nombre}**. Literalmente el glotón de energía.`,
            nombre => `Diría que **${nombre}** está dándose un festín eléctrico.`,
            nombre => `Si quieres bajar consumo, empieza por **${nombre}**. Es el rey del derroche.`
        ],
        consejo: [
            "Tip rápido: desconecta cargadores cuando no los uses. Chupan de poquito en poquito.",
            "Un truco: horarios. Usa aparatos pesados fuera de picos energéticos.",
            "Ventila en vez de prender aire. Tu cartera lo agradece."
        ],
        alerta: [
            "Hmm… si notas picos raros, revisa los aparatos viejos. Suelen fallar.",
            "Eso suena alto. Quizá un dispositivo está quedándose pegado.",
            "Revisa el Horno o la PC. Son sospechosos comunes."
        ],
        fallback: [
            "No entendí eso, pero juro que estoy aprendiendo 😅",
            "Intenta decirlo diferente. Mi cerebro eléctrico no captó.",
            "Mmm… no tengo respuesta a eso todavía, pero puedo ver tu consumo si quieres."
        ]
    };

    // ==== 3. RESPUESTAS QUE USAN BACKEND ====

    // consumo hoy
    if (esHoy) {
        const res = await fetch("http://localhost:3000/api/consumo/hoy");
        const data = await res.json();
        const valor = data.TotalHoy?.toFixed(2) || "0.00";

        const r = respuestas.hoy[Math.floor(Math.random() * respuestas.hoy.length)];
        addMessage(r(valor), "bot");
        return;
    }

    // dispositivo más gastón
    if (esDispositivo) {
        const res = await fetch("http://localhost:3000/api/dispositivos/consumo");
        const data = await res.json();

        const top = data[0]?.Nombre || "ninguno";
        const r = respuestas.dispositivo[Math.floor(Math.random() * respuestas.dispositivo.length)];
        addMessage(r(top), "bot");
        return;
    }

    // ==== 4. RESPUESTAS SIMPLES ====

    if (esSaludo) {
        const r = respuestas.saludo[Math.floor(Math.random() * respuestas.saludo.length)];
        addMessage(r, "bot");
        return;
    }

    if (esSemana) {
        const r = respuestas.semana[Math.floor(Math.random() * respuestas.semana.length)];
        addMessage(r, "bot");
        return;
    }

    if (esConsejo) {
        const r = respuestas.consejo[Math.floor(Math.random() * respuestas.consejo.length)];
        addMessage(r, "bot");
        return;
    }

    if (esAlerta) {
        const r = respuestas.alerta[Math.floor(Math.random() * respuestas.alerta.length)];
        addMessage(r, "bot");
        return;
    }

    // ==== 5. FALLBACK (cuando no entiende nada) ====
    const r = respuestas.fallback[Math.floor(Math.random() * respuestas.fallback.length)];
    addMessage(r, "bot");
}


// Mensaje inicial
addMessage("Hola, soy tu EcoBot ⚡ ¿En qué te ayudo?", "bot");

/* ==========================================================
   CONTROL DE DISPOSITIVOS — FUNCIONALIDAD REAL (TINYINT)
========================================================== */
async function cambiarEstado(id, estado, boton) {
    const res = await fetch("http://localhost:3000/api/control/cambiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDispositivo: id, estado })
    });

    const data = await res.json();
    console.log("Respuesta backend:", data);

    // Cambia visualmente el botón
    if (estado === 1) {
        boton.classList.add("on");
    } else {
        boton.classList.remove("on");
    }
}

// Asignar listeners a TODAS las tarjetas
function activarBotonesDispositivos() {
    const tarjetas = document.querySelectorAll(".device-card");

    tarjetas.forEach(card => {
        const id = parseInt(card.getAttribute("data-id"));
        const powerBtn = card.querySelector(".power-btn");

        // Obtener estado inicial desde la DB
        fetch(`http://localhost:3000/api/control/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data?.Estado === 1) powerBtn.classList.add("on");
            });

        // Click para prender/apagar
        powerBtn.addEventListener("click", () => {
            const nuevoEstado = powerBtn.classList.contains("on") ? 0 : 1;
            cambiarEstado(id, nuevoEstado, powerBtn);
        });
    });
}

// Ejecutarlo al cargar
document.addEventListener("DOMContentLoaded", activarBotonesDispositivos);
