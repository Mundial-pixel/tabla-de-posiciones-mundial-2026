const resultsDiv = document.getElementById('results');
const upcomingDiv = document.getElementById('upcoming');
const groupsDiv = document.getElementById('groups');

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_GROUPS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/standings';

async function mostrarResultados() {
    try {
        const res = await fetch(ESPN_URL);
        const data = await res.json();

        if (!data.events || data.events.length === 0) {
            resultsDiv.innerHTML = '<p>No hay partidos hoy. Revisa próximos partidos abajo.</p>';
            return;
        }

        resultsDiv.innerHTML = data.events.map(match => {
            const home = match.competitions[0].competitors.find(t => t.homeAway === 'home');
            const away = match.competitions[0].competitors.find(t => t.homeAway === 'away');
            const status = match.status.type;

            let estadoClase = '';
            let estadoTexto = status.description;

            if (status.state === 'in') {
                estadoClase = 'estado-vivo';
                estadoTexto = `EN VIVO ${status.displayClock}`;
            } else if (status.state === 'post') {
                estadoClase = 'estado-final';
                estadoTexto = 'Finalizado';
            }

            return `
                <div class="partido">
                    <p><strong>${home.team.displayName}</strong> ${home.score} - ${away.score} <strong>${away.team.displayName}</strong></p>
                    <p class="${estadoClase}">Estado: ${estadoTexto}</p>
                    <p>Grupo: ${match.competitions[0].groups?.name || match.competitions[0].notes[0]?.headline || 'Fase de Grupos'}</p>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `<p style="color:red">Error cargando datos. Recarga la página.</p>`;
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
        console.error('Error:', error);
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
        console.error('Error:', error);
        groupsDiv.innerHTML = `<p style="color:red">Error cargando tabla de posiciones.</p>`;
    }
}

mostrarResultados();
mostrarProximosPartidos();
mostrarTablaPosiciones();

setInterval(mostrarResultados, 45000);
