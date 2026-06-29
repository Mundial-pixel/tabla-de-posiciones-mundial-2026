async function mostrarTablaPosiciones() {
    try {
        groupsDiv.innerHTML = t('cargandoGrupos');
        const res = await fetch(ESPN_GROUPS_URL);
        const data = await res.json();

        if (!data.children) {
            groupsDiv.innerHTML = `<p>${t('errorTabla')}</p>`;
            return;
        }

        let clasificados = [];
        let eliminados = [];
        let enDisputa = [];

        // Recorrer todos los grupos y sacar clasificados/eliminados
        data.children.forEach(grupo => {
            const equipos = grupo.standings.entries;
            
            equipos.forEach((equipo, idx) => {
                const stats = equipo.stats;
                const pj = stats.find(s => s.name === 'gamesPlayed')?.value || 0;
                const pts = stats.find(s => s.name === 'points')?.value || 0;
                const dg = stats.find(s => s.name === 'pointDifferential')?.value || 0;
                
                const equipoData = {
                    nombre: equipo.team.displayName,
                    grupo: grupo.name,
                    pj: pj,
                    pts: pts,
                    dg: dg,
                    pos: idx + 1
                };

                // Lógica: Si jugó 3 partidos
                if (pj >= 3) {
                    if (idx < 2) {
                        clasificados.push(equipoData); // Top 2 clasifican
                    } else {
                        eliminados.push(equipoData); // 3ro y 4to eliminados
                    }
                } 
                // Si jugó 2 partidos y ya está clasificado matemáticamente
                else if (pj === 2 && pts >= 6) {
                    clasificados.push(equipoData);
                }
                // Si jugó 2 y tiene 0 pts, casi eliminado
                else if (pj === 2 && pts === 0) {
                    eliminados.push(equipoData);
                }
                // Resto en disputa
                else {
                    enDisputa.push(equipoData);
                }
            });
        });

        // Ordenar clasificados por puntos y diferencia de gol
        clasificados.sort((a, b) => b.pts - a.pts || b.dg - a.dg);
        eliminados.sort((a, b) => b.pts - a.pts || b.dg - a.dg);

        // HTML de las listas
        let listasHTML = `
            <div class="listas-clasificacion">
                <div class="lista-clasificados">
                    <h3>✅ ${t('clasificados')} a Octavos (${clasificados.length})</h3>
                    ${clasificados.length > 0 ? `
                        <div class="equipos-grid">
                            ${clasificados.map(e => `
                                <div class="equipo-clasificado">
                                    <strong>${e.nombre}</strong>
                                    <span>${e.grupo} - ${e.pts} pts (${e.dg > 0 ? '+' : ''}${e.dg})</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p>Todavía no hay clasificados</p>`}
                </div>

                <div class="lista-eliminados">
                    <h3>❌ ${t('eliminados')} (${eliminados.length})</h3>
                    ${eliminados.length > 0 ? `
                        <div class="equipos-grid">
                            ${eliminados.map(e => `
                                <div class="equipo-eliminado">
                                    <strong>${e.nombre}</strong>
                                    <span>${e.grupo} - ${e.pts} pts (${e.dg > 0 ? '+' : ''}${e.dg})</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p>Todavía no hay eliminados</p>`}
                </div>
            </div>
        `;

        // Tablas normales por grupo
        let tablasHTML = data.children.map(grupo => {
            const equipos = grupo.standings.entries;

            return `
                <div class="grupo-tabla">
                    <h3>${grupo.name}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>${t('pos')}</th>
                                <th>${t('equipo')}</th>
                                <th>${t('pj')}</th>
                                <th>${t('g')}</th>
                                <th>${t('e')}</th>
                                <th>${t('p')}</th>
                                <th>${t('gf')}</th>
                                <th>${t('gc')}</th>
                                <th>${t('dg')}</th>
                                <th>${t('pts')}</th>
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
                                if (pj >= 2 && idx < 2) clase = 'clasificado';
                                if (pj >= 2 && idx > 1 && pts < 3) clase = 'eliminado';

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

        groupsDiv.innerHTML = listasHTML + tablasHTML;

    } catch (error) {
        console.error('Error tabla:', error);
        groupsDiv.innerHTML = `<p style="color:red">${t('errorTabla')}</p>`;
    }
}
