async function mostrarResultados() {
    try {
        const res = await fetch(ESPN_URL);
        const data = await res.json();

        if (!data.events || data.events.length === 0) {
            resultsDiv.innerHTML = '<p>No hay partidos hoy. Revisa próximos partidos abajo.</p>';
            return;
        }

        resultsDiv.innerHTML = data.events.map(match => {
            const comp = match.competitions[0];
            const home = comp.competitors.find(t => t.homeAway === 'home');
            const away = comp.competitors.find(t => t.homeAway === 'away');
            const status = match.status.type;

            const horaPartido = new Date(match.date).toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            let estadoClase = '';
            let estadoTexto = status.description;

            if (status.state === 'in') {
                estadoClase = 'estado-vivo';
                // Arreglo para el "EN VIVO undefined"
                const reloj = status.displayClock? status.displayClock : 'En juego';
                estadoTexto = `EN VIVO ${reloj}`;
            } else if (status.state === 'post') {
                estadoClase = 'estado-final';
                estadoTexto = 'Finalizado';
            } else if (status.state === 'pre') {
                estadoTexto = `Hoy a las ${horaPartido}`;
            }

            // Goles con validación total del equipo
            let golesHTML = '';
            if (comp.details && comp.details.length > 0) {
                const goles = comp.details.filter(d => d.scoringPlay === true && d.clock && d.clock.displayValue);

                if (goles.length > 0) {
                    golesHTML = `
                        <div class="goles">
                            <strong>Goles:</strong>
                            ${goles.map(gol => {
                                let jugador = 'Jugador';
                                if (gol.athletesInvolved && gol.athletesInvolved.length > 0 && gol.athletesInvolved[0].displayName) {
                                    jugador = gol.athletesInvolved[0].displayName;
                                }

                                // Arreglo definitivo para el equipo undefined
                                let equipoGol = 'Equipo';
                                if (gol.team && gol.team.id) {
                                    if (gol.team.id === home.team.id) {
                                        equipoGol = home.team.displayName;
                                    } else if (gol.team.id === away.team.id) {
                                        equipoGol = away.team.displayName;
                                    } else if (gol.team.displayName) {
                                        equipoGol = gol.team.displayName;
                                    }
                                }

                                return `<p>⚽ ${gol.clock.displayValue}' - ${equipoGol}: ${jugador}</p>`;
                            }).join('')}
                        </div>
                    `;
                }
            }

            let grupoTexto = 'Fase de Grupos';
            if (comp.groups && comp.groups.name) {
                grupoTexto = comp.groups.name;
            } else if (comp.notes && comp.notes.length > 0 && comp.notes[0].headline) {
                grupoTexto = comp.notes[0].headline;
            }

            return `
                <div class="partido">
                    <p><strong>${home.team.displayName}</strong> ${home.score} - ${away.score} <strong>${away.team.displayName}</strong></p>
                    <p class="${estadoClase}">Estado: ${estadoTexto}</p>
                    <p>Grupo: ${grupoTexto}</p>
                    ${golesHTML}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `<p style="color:red">Error cargando datos. Intenta recargar en 1 minuto.</p>`;
    }
}
