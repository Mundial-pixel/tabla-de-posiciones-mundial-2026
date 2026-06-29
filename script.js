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

            // Hora del partido
            const horaPartido = new Date(match.date).toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            let estadoClase = '';
            let estadoTexto = status.description;

            if (status.state === 'in') {
                estadoClase = 'estado-vivo';
                estadoTexto = `EN VIVO ${status.displayClock}`;
            } else if (status.state === 'post') {
                estadoClase = 'estado-final';
                estadoTexto = 'Finalizado';
            } else if (status.state === 'pre') {
                estadoClase = '';
                estadoTexto = `Hoy a las ${horaPartido}`;
            }

            // Sacamos los goles con minuto y jugador
            let golesHTML = '';
            if (comp.details && comp.details.length > 0) {
                const goles = comp.details.filter(d => d.scoringPlay === true);

                if (goles.length > 0) {
                    golesHTML = `
                        <div class="goles">
                            <strong>Goles:</strong>
                            ${goles.map(gol => `
                                <p>⚽ ${gol.clock.displayValue}' - ${gol.team.displayName}: ${gol.athletesInvolved? gol.athletesInvolved[0].displayName : 'Jugador'}</p>
                            `).join('')}
                        </div>
                    `;
                }
            }

            return `
                <div class="partido">
                    <p><strong>${home.team.displayName}</strong> ${home.score} - ${away.score} <strong>${away.team.displayName}</strong></p>
                    <p class="${estadoClase}">Estado: ${estadoTexto}</p>
                    <p>Grupo: ${comp.groups?.name || comp.notes[0]?.headline || 'Fase de Grupos'}</p>
                    ${golesHTML}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `<p style="color:red">Error cargando datos. Recarga la página.</p>`;
    }
}
