const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest='
];
const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/standings';

let idiomaActual = 'es';
let datosCache = null;

const textos = {
    es: {
        subtitle: 'Datos actualizados automáticamente desde ESPN',
        todayMatches: 'Partidos de Hoy - 16avos de Final',
        nextMatches: 'Próximos Partidos',
        groupStandings: 'Tabla de Posiciones por Grupos',
        loading: 'Cargando...',
        noMatches: 'No hay partidos hoy. Revisa próximos partidos abajo.',
        noUpcoming: 'No hay próximos partidos disponibles aún.',
        noStandings: 'La tabla de posiciones aún no está disponible.',
        error: 'Error cargando datos. ESPN puede estar actualizando.',
        live: 'EN VIVO',
        finished: 'Finalizado',
        scheduled: 'Programado',
        goals: 'Goles',
        goalBy: 'Gol de',
        donationTitle: 'Colabora con el proyecto',
        donationText: 'Si te gusta esta web, puedes apoyar con una donación',
        welcomeMsg: 'Hola gusto en saludarte soy de Venezuela, diseñé esta web sin saber programación, pero lo he intentado con mucho cariño para mostrar resultados del mundial. Si deseas colaborar, estaré agradecido de corazón, saludos.',
        group: 'Grupo', team: 'Equipo',
        pj: 'PJ', g: 'G', e: 'E', p: 'P', gf: 'GF', gc: 'GC', dg: 'DG', pts: 'PTS'
    },
    en: {
        subtitle: 'Data automatically updated from ESPN',
        todayMatches: "Today's Matches - Round of 16",
        nextMatches: 'Upcoming Matches',
        groupStandings: 'Group Standings',
        loading: 'Loading...',
        noMatches: 'No matches today. Check upcoming matches below.',
        noUpcoming: 'No upcoming matches available yet.',
        noStandings: 'Group standings not available yet.',
        error: 'Error loading data. ESPN may be updating.',
        live: 'LIVE',
        finished: 'Finished',
        scheduled: 'Scheduled',
        goals: 'Goals',
        goalBy: 'Goal by',
        donationTitle: 'Support the project',
        donationText: 'If you like this website, you can support with a donation',
        welcomeMsg: 'Hello, nice to meet you. I am from Venezuela. I designed this website without knowing programming, but I have tried with a lot of love to show World Cup results. If you wish to collaborate, I will be grateful from the heart. Greetings.',
        group: 'Group', team: 'Team',
        pj: 'MP', g: 'W', e: 'D', p: 'L', gf: 'GF', gc: 'GA', dg: 'GD', pts: 'PTS'
    }
};

function cambiarIdioma() {
    idiomaActual = document.getElementById('languageSelect').value;
    const t = textos[idiomaActual];
    document.getElementById('subtitle').textContent = t.subtitle;
    document.getElementById('todayMatches').textContent = t.todayMatches;
    document.getElementById('nextMatches').textContent = t.nextMatches;
    document.getElementById('groupStandings').textContent = t.groupStandings;
    document.getElementById('donationTitle').textContent = t.donationTitle;
    document.getElementById('donationText').textContent = t.donationText;
    document.getElementById('welcomeMsg').textContent = t.welcomeMsg;
    if (datosCache) mostrarDatos(datosCache);
}

async function fetchConProxy(url) {
    for (let proxy of PROXIES) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url));
            if (response.ok) return await response.json();
        } catch (e) { console.log('Proxy falló:', proxy); }
    }
    throw new Error('Todos los proxies fallaron');
}

async function cargarDatos() {
    try {
        const data = await fetchConProxy(ESPN_SCOREBOARD);
        datosCache = data;
        mostrarDatos(data);
        cargarPosiciones();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('partidos-hoy').innerHTML = `<div class="error">${textos[idiomaActual].error}</div>`;
        document.getElementById('proximos-partidos').innerHTML = `<div class="error">${textos[idiomaActual].error}</div>`;
    }
}

function mostrarDatos(data) {
    const t = textos[idiomaActual];
    const hoy = new Date().toISOString().split('T')[0];

    const eventos = data.events || [];
    const partidosHoy = eventos.filter(e => e.date.startsWith(hoy));
    const proximosPartidos = eventos.filter(e => new Date(e.date) > new Date()).slice(0, 10);

    mostrarPartidos(partidosHoy, 'partidos-hoy', t.noMatches);
    mostrarProximosPartidos(proximosPartidos, 'proximos-partidos', t.noUpcoming);
}

function obtenerEstadoPartido(status, homeScore, awayScore) {
    const t = textos[idiomaActual];
    if ((homeScore > 0 || awayScore > 0) && status === 'STATUS_SCHEDULED') {
        return { class: 'status-finished', text: t.finished };
    }
    if (status === 'STATUS_IN_PROGRESS' || status === 'STATUS_HALFTIME') {
        return { class: 'status-live', text: t.live };
    }
    if (status === 'STATUS_FINAL' || status === 'STATUS_FULL_TIME') {
        return { class: 'status-finished', text: t.finished };
    }
    return { class: 'status-scheduled', text: t.scheduled };
}

function obtenerGoles(competition) {
    const goles = [];
    if (!competition.details) return goles;

    competition.details.forEach(detail => {
        // ESPN usa 'score' type para goles
        if (detail.type && detail.type.text === 'Goal' && detail.athletesInvolved) {
            const jugador = detail.athletesInvolved[0];
            goles.push({
                minuto: detail.clock.displayValue || detail.clock.value,
                jugador: jugador.displayName,
                equipo: detail.team.displayName,
                propio: detail.ownGoal || false
            });
        }
    });
    return goles;
}

function obtenerFase(competition) {
    // ESPN trae la fase en competition.notes o type
    if (competition.notes && competition.notes.length > 0) {
        const nota = competition.notes[0].headline;
        if (nota.includes('Round of 16')) return idiomaActual === 'es'? '16avos de Final' : 'Round of 16';
        if (nota.includes('Quarterfinal')) return idiomaActual === 'es'? 'Cuartos de Final' : 'Quarterfinals';
        if (nota.includes('Semifinal')) return idiomaActual === 'es'? 'Semifinal' : 'Semifinal';
        if (nota.includes('Final')) return 'Final';
        return nota;
    }
    return '';
}

function mostrarPartidos(partidos, elementId, mensajeVacio) {
    const t = textos[idiomaActual];
    const contenedor = document.getElementById(elementId);
    if (!partidos || partidos.length === 0) {
        contenedor.innerHTML = `<p>${mensajeVacio}</p>`;
        return;
    }

    contenedor.innerHTML = partidos.map(partido => {
        const comp = partido.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const homeScore = parseInt(home.score) || 0;
        const awayScore = parseInt(away.score) || 0;
        const estado = obtenerEstadoPartido(comp.status.type.name, homeScore, awayScore);
        const goles = obtenerGoles(comp);
        const fase = obtenerFase(comp);

        let golesHTML = '';
        if (goles.length > 0) {
            golesHTML = `
                <div class="goal-list">
                    <strong>⚽ ${t.goals}:</strong>
                    ${goles.map(g => `
                        <div class="goal-item">
                            <span class="goal-icon">⚽</span>
                            <span class="goal-minute">${g.minuto}'</span>
                            <span class="goal-player">${g.jugador}</span>
                            <span class="goal-team">(${g.equipo})${g.propio? ' (GEC)' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="match-card">
                <div class="match-teams">
                    <div class="team">
                        <span class="team-name">${home.team.displayName}</span>
                    </div>
                    <div class="score">${homeScore} - ${awayScore}</div>
                    <div class="team" style="justify-content: flex-end;">
                        <span class="team-name">${away.team.displayName}</span>
                    </div>
                </div>
                <div class="match-info">
                    <span class="${estado.class}">${estado.text}</span>
                    ${fase? `<span class="match-stage">${fase}</span>` : ''}
                    <span style="margin-left: 10px;">${new Date(partido.date).toLocaleString(idiomaActual === 'es'? 'es-ES' : 'en-US')}</span>
                </div>
                ${golesHTML}
            </div>
        `;
    }).join('');
}

function mostrarProximosPartidos(partidos, elementId, mensajeVacio) {
    const t = textos[idiomaActual];
    const contenedor = document.getElementById(elementId);

    if (!partidos || partidos.length === 0) {
        contenedor.innerHTML = `<p>${mensajeVacio}</p>`;
        return;
    }

    contenedor.innerHTML = partidos.map(partido => {
        const comp = partido.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const fase = obtenerFase(comp);

        return `
            <div class="match-card">
                <div class="match-teams">
                    <div class="team">
                        <span class="team-name">${home.team.displayName}</span>
                    </div>
                    <div class="score">vs</div>
                    <div class="team" style="justify-content: flex-end;">
                        <span class="team-name">${away.team.displayName}</span>
                    </div>
                </div>
                <div class="match-info">
                    <span class="status-scheduled">${t.scheduled}</span>
                    ${fase? `<span class="match-stage">${fase}</span>` : ''}
                    <span style="margin-left: 10px;">${new Date(partido.date).toLocaleString(idiomaActual === 'es'? 'es-ES' : 'en-US')}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function cargarPosiciones() {
    try {
        const data = await fetchConProxy(ESPN_STANDINGS);
        mostrarPosiciones(data);
    } catch (error) {
        console.error('Error standings:', error);
        document.getElementById('tabla-posiciones').innerHTML = `<p>${textos[idiomaActual].noStandings}</p>`;
    }
}

function mostrarPosiciones(data) {
    const t = textos[idiomaActual];
    const contenedor = document.getElementById('tabla-posiciones');

    if (!data.children || data.children.length === 0) {
        contenedor.innerHTML = `<p>${t.noStandings}</p>`;
        return;
    }

    let html = '';
    data.children.forEach(grupo => {
        if (!grupo.standings ||!grupo.standings.entries) return;

        html += `<h3 style="margin-top: 20px; color: #1e3c72;">${t.group} ${grupo.name || grupo.abbreviation}</h3>`;
        html += `
            <table>
                <thead>
                    <tr>
                        <th>${t.team}</th><th>${t.pj}</th><th>${t.g}</th><th>${t.e}</th>
                        <th>${t.p}</th><th>${t.gf}</th><th>${t.gc}</th><th>${t.dg}</th><th>${t.pts}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        grupo.standings.entries.forEach((entry, index) => {
            const stats = entry.stats;
            const className = index < 2? 'qualified' : '';
            const getStat = (name) => stats.find(s => s.name === name)?.value || 0;

            html += `
                <tr class="${className}">
                    <td>${entry.team.displayName}</td>
                    <td>${getStat('gamesPlayed')}</td>
                    <td>${getStat('wins')}</td>
                    <td>${getStat('ties')}</td>
                    <td>${getStat('losses')}</td>
                    <td>${getStat('pointsFor')}</td>
                    <td>${getStat('pointsAgainst')}</td>
                    <td>${getStat('pointDifferential')}</td>
                    <td><strong>${getStat('points')}</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    });

    contenedor.innerHTML = html || `<p>${t.noStandings}</p>`;
}

cargarDatos();
setInterval(cargarDatos, 300000);
