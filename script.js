const resultsDiv = document.getElementById('results');
const upcomingDiv = document.getElementById('upcoming');
const groupsDiv = document.getElementById('groups');

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_GROUPS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/standings';

console.log('Script iniciado');

async function mostrarResultados() {
    try {
        console.log('Cargando resultados...');
        const res = await fetch(ESPN_URL);
        const data = await res.json();
        console.log('Datos recibidos:', data);

        if (!data.events || data.events.length === 0) {
            resultsDiv.innerHTML = '<p>No hay partidos hoy. Revisa próximos partidos abajo.</p>';
            return;
        }

        resultsDiv.innerHTML = data.events.map(match => {
            try {
                const comp = match.competitions[0];
                const home = comp.competitors.find(t => t.homeAway === 'home');
                const away = comp.competitors.find(t => t.homeAway === 'away');
                const status = match.status.type;

                const horaPartido = new Date(match.date).toLocaleTimeString('es-VE', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let estadoClase = '';
                let estadoTexto = status.description || 'Programado';

                if (status.state === 'in') {
                    estadoClase = 'estado-vivo';
                    const reloj = status.displayClock || 'En juego';
                    estadoTexto = `EN VIVO ${reloj}`;
                } else if (status.state === 'post') {
                    estadoClase = 'estado-final';
                    estadoTexto = 'Finalizado';
                } else if (status.state === 'pre') {
                    estadoTexto = `Hoy a las ${horaPartido}`;
                }

                let golesHTML = '';
                if (comp.details && Array.isArray(comp.details)) {
                    const goles = comp.details.filter(d => d && d.scoringPlay === true && d.clock && d.clock.displayValue);

                    if (goles.length > 0) {
                        golesHTML = `
                            <div class="goles">
                                <strong>Goles:</strong>
                                ${goles.map(gol => {
                                    let jugador = 'Jugador';
                                    if (gol.athletesInvolved && gol.athletesInvolved[0] && gol.athletesInvolved[0].displayName) {
                                        jugador = gol.athletesInvolved[0].displayName;
                                    }

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
                } else if (comp.notes && comp.notes[0] && comp.notes[0].headline) {
                    grupoTexto = comp.notes[0].headline;
                }

                return `
                    <div class="partido">
                        <p><strong>${home.team.displayName}</strong> ${home.score || 0} - ${away.score || 0} <strong>${away.team.displayName}</strong></p>
                        <p class="${estadoClase}">Estado: ${estadoTexto}</p>
                        <p>Grupo: ${grupoTexto}</p>
                        ${golesHTML}
                    </div>
                `;
            } catch (err) {
                console.error('Error en un partido:', err);
                return `<div class="partido"><p>Error cargando este partido</p></div>`;
            }
        }).join('');

    } catch (error) {
        console.error('Error general:', error);
        resultsDiv.innerHTML = `<p style="color:red">Error cargando datos. ESPN no responde. Recarga en 2 minutos.</p>`;
    }
}

async function mostrarProximosPartidos() {
    try {
        const res = await fetch(ESPN_URL + '?dates=20260629-20260705');
        const data = await res.json();

        const proximos = data.events.filter(e => e.status.type.state === 'pre').slice(0, 10);

        if (proximos.length === 0) {
            upcomingDiv.innerHTML = '<p>No hay próximos partidos esta semana.</p>';
            return;
        }

        upcomingDiv.innerHTML = proximos.map(match => {
            const home = match.competitions[0].competitors.find(t => t.homeAway === 'home');
            const away = match.competitions[0].competitors.find(t => t.homeAway === 'away');
            const fecha = new Date(match.date).toLocaleString('es-VE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="partido">
                    <p><strong>${home.team.displayName} vs ${away.team.displayName}</strong></p>
                    <p>Fecha: ${fecha}</p>
                    <p>${match.competitions[0].venue?.fullName || 'Estadio por confirmar'}</p>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error próximos:', error);
        upcomingDiv.innerHTML = `<p style="color:red">Error cargando próximos partidos.</p>`;
    }
}

async function mostrarTablaPosiciones() {
    try {
        const res = await fetch(ESPN_GROUPS_URL);
        const data = await res.json();

        if (!data.children) {
            groupsDiv.innerHTML = '<p>No se pudo cargar la tabla de posiciones.</p>';
            return;
        }

        groupsDiv.innerHTML = data.children.map(grupo => {
            const equipos = grupo.standings.entries;

            return `
                <div class="grupo-tabla">
                    <h3>${grupo.name}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Equipo</th>
                                <th>PJ</th>
                                <th>G</th>
                                <th>E</th>
                                <th>P</th>
                                <th>GF</th>
                                <th>GC</th>
                                <th>DG</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${equipos.map((equipo, idx) => {
                                const stats = equipo.stats;
                                const pj = stats.find(s => s.name === 'gamesPlayed')?.value || 0;
                                const g = stats.find(s => s.name === 'wins')?.value || 0;
                                const e = stats.find(s => s.name === 'ties')?.value || 0;
                                const p = stats.find(s => s.name === 'losses')?.value || 0;
                                const gf = stats.find(s => s.name === 'pointsFor')?.value || 0;
                                const gc = stats.find(s => s.name === 'pointsAgainst')?.value || 0;
                                const dg = stats.find(s => s.name === 'pointDifferential')?.value || 0;
                                const pts = stats.find(s => s.name === 'points')?.value || 0;

                                let clase = '';
                                if (idx < 2 && pj >= 2) clase = 'clasificado';
                                if (idx > 1 && pj >= 2 && pts < 3) clase = 'eliminado';

                                return `
                                    <tr class="${clase}">
                                        <td>${idx + 1}</td>
                                        <td style="text-align:left">${equipo.team.displayName}</td>
                                        <td>${pj}</td>
                                        <td>${g}</td>
                                        <td>${e}</td>
                                        <td>${p}</td>
                                        <td>${gf}</td>
                                        <td>${gc}</td>
                                        <td>${dg}</td>
                                        <td><strong>${pts}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error tabla:', error);
        groupsDiv.innerHTML = `<p style="color:red">Error cargando tabla de posiciones.</p>`;
    }
}

mostrarResultados();
mostrarProximosPartidos();
mostrarTablaPosiciones();

setInterval(mostrarResultados, 45000);
