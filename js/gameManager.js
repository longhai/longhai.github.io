class GameManager {
    constructor() {
        this.currentPage = 1;
        this.gamesPerPage = 20;
        this.filteredGames = [];
        this.headerName = '';
        this.headerDescription = '';
        this.currentCore = '';
        this.totalGames = 0;
        this.searchKeyword = '';
        this.selectedLetter = 'All';
        this.regionPriority = { 'japan': 1, 'usa': 2, 'europe': 3 };
        this.excludedKeywords = ['bios', 'test', 'in-1', 'demo', 'beta', 'retro-bit', 'aftermarket', 'video'];
    }

    async loadMenuContent(menuItem) {
        const platformName = menuItem.textContent.trim();
        this.currentCore = menuItem.getAttribute('core');
        const datFile = `dat/${platformName}.dat`;

        try {
            const response = await fetch(datFile);
            const text = await response.text();
            const xmlDoc = this.parseXML(text);
            this.processGames(xmlDoc);
        } catch (error) {
            this.handleError(error);
        }
    }

    parseXML(xmlString) {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'text/xml');
    }

    processGames(xmlDoc) {
        this.headerName = xmlDoc.querySelector('header > name').textContent.trim();
        this.headerDescription = xmlDoc.querySelector('header > description').textContent.trim();
        const games = Array.from(xmlDoc.querySelectorAll('game'));

        const uniqueGames = {};
        games.forEach(game => {
            const baseName = game.getAttribute('name').replace(/\s*\(.*?\)/g, '').toLowerCase();
            const regionMatch = game.getAttribute('name').match(/\((japan|usa|europe)\)/i);
            const region = regionMatch ? regionMatch[1].toLowerCase() : '';
            const revisionMatch = game.getAttribute('name').match(/Rev\s*([A-Za-z]|\d+)/i);
            const revision = revisionMatch ? revisionMatch[1] : '';

            if (!(baseName in uniqueGames) || this.compareGames(uniqueGames[baseName], game, region, revision) < 0) {
                uniqueGames[baseName] = { game, region, revision };
            }
        });

        this.filteredGames = Object.values(uniqueGames).map(obj => obj.game);
        this.filteredGames = this.filteredGames.filter(game => !this.excludedKeywords.some(keyword => game.getAttribute('name').toLowerCase().includes(keyword)));
        this.filteredGames.sort((a, b) => a.getAttribute('name').toLowerCase().localeCompare(b.getAttribute('name').toLowerCase()));

        this.totalGames = this.filteredGames.length;
        this.updateLogo(this.headerDescription);
        this.renderGames(this.currentPage);
    }

    compareGames(existingGame, newGame, newRegion, newRevision) {
        const existingRegion = existingGame.region;
        const existingRevision = existingGame.revision;

        if (this.headerName === 'Sony - PlayStation' && newRegion && existingRegion) {
            const newRegionPriority = this.regionPriority[newRegion];
            const existingRegionPriority = this.regionPriority[existingRegion];

            if (newRegionPriority > existingRegionPriority) {
                return 1;
            } else if (newRegionPriority < existingRegionPriority) {
                return -1;
            } else {
                if (newRevision > existingRevision) {
                    return 1;
                } else if (newRevision < existingRevision) {
                    return -1;
                } else {
                    return 0;
                }
            }
        } else {
            return 0;
        }
    }

    handleError(error) {
        console.error('Error fetching or parsing .dat file:', error);
        document.getElementById('gameList').innerHTML = `<p>Error loading games. Please try again later.</p>`;
    }

    renderGames(page) {
        const startIndex = (page - 1) * this.gamesPerPage;
        const endIndex = startIndex + this.gamesPerPage;

        let filteredGamesToShow = this.applyLetterFilter(this.filteredGames);
        filteredGamesToShow = this.applySearchFilter(filteredGamesToShow);

        const gamesToShow = filteredGamesToShow.slice(startIndex, endIndex);
        const gamesList = document.getElementById('gameList');
        gamesList.innerHTML = '';

        gamesToShow.forEach(game => this.createGameElement(game, gamesList));
        this.updatePaginationButtons(page, filteredGamesToShow.length);
    }

    applyLetterFilter(games) {
        if (this.selectedLetter === 'All') return games;
        return games.filter(game => {
            const gameName = game.getAttribute('name');
            if (this.selectedLetter === '#') {
                return !/^[A-Za-z]/.test(gameName.charAt(0));
            } else {
                return gameName.charAt(0).toUpperCase() === this.selectedLetter;
            }
        });
    }

    applySearchFilter(games) {
        return games.filter(game => game.getAttribute('name').toLowerCase().includes(this.searchKeyword));
    }

    createGameElement(game, gamesList) {
        const gameName = game.getAttribute('name');
        const gameDescription = game.querySelector('description').textContent;

        const gameElement = document.createElement('div');
        gameElement.classList.add('game');
        gameElement.innerHTML = `
            <img src="snap/${encodeURIComponent(this.headerDescription)}/${encodeURIComponent(gameName)}.png" 
                 alt="${gameName}" 
                 data-gameurl="${this.createGameUrl(gameName)}"> <!-- Use createGameUrl method to generate game URL -->
            <p>${gameDescription}</p>
        `;

        gameElement.querySelector('img').addEventListener('error', function () {
            this.src = 'https://via.placeholder.com/512x409.6?text=No+Image';
        });

        gameElement.querySelector('img').addEventListener('click', () => {
            const gameUrl = gameElement.querySelector('img').getAttribute('data-gameurl');
            this.playGame(this.currentCore, gameUrl);
        });

        gamesList.appendChild(gameElement);
    }

    createGameUrl(gameName) {
        if (this.headerName === 'Sony - PlayStation') {
            if (gameName.includes('(Japan)')) {
                return `https://ia801905.us.archive.org/cors_get.php?path=/10/items/chd_psx_jap/CHD-PSX-JAP/${encodeURIComponent(gameName)}.chd`;
            } else if (gameName.includes('(USA)')) {
                return `https://ia801704.us.archive.org/cors_get.php?path=/12/items/chd_psx/CHD-PSX-USA/${encodeURIComponent(gameName)}.chd`;
            } else if (gameName.includes('(Europe)')) {
                return `https://ia601801.us.archive.org/cors_get.php?path=/21/items/chd_psx_eur/CHD-PSX-EUR/${encodeURIComponent(gameName)}.chd`;
            } else {
                return `https://archive.org/download/ni-roms/roms/${encodeURIComponent(this.headerName)}.zip/${encodeURIComponent(gameName)}.zip`;
            }
        } else if (this.headerName === 'arcade') {
            return `https://archive.org/download/2020_01_06_fbn/roms/${encodeURIComponent(this.headerName)}.zip/arcade/${encodeURIComponent(gameName)}.zip`;
        } else {
            return `https://archive.org/download/ni-roms/roms/${encodeURIComponent(this.headerName)}.zip/${encodeURIComponent(gameName)}.zip`;
        }
    }

    playGame(core, gameUrl) {
        const gameFrame = document.getElementById('gameFrame');
        gameFrame.src = `https://longhai.github.io/load.html?core=${core}&url=${encodeURIComponent(gameUrl)}`;
        document.getElementById('gameOverlay').style.display = 'block';
    }

    updatePaginationButtons(page, totalFilteredGames) {
        const totalPages = Math.ceil(totalFilteredGames / this.gamesPerPage);

        document.getElementById('prevBtn').disabled = page === 1;
        document.getElementById('nextBtn').disabled = page === totalPages || totalPages === 0;

        document.getElementById('pageInfo').textContent = `Page ${page} of ${totalPages}`;
        document.getElementById('totalGamesInfo').textContent = `(${totalFilteredGames})`;
    }

    updateLogo(description) {
        document.getElementById('logoImg').src = `logo/${description}.png`;
        document.getElementById('logoName').textContent = description;
    }
}

export default GameManager;
