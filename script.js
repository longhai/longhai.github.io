document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        systemSelectButton: document.querySelector('.btn-select'),
        categorySelect: document.getElementById('categoryFilter'),
        searchBar: document.getElementById('searchBar'),
        filterCloneOf: document.getElementById('filterCloneOf'),
        gameList: document.getElementById('gameList'),
        gameCount: document.getElementById('gameCount'),
        letterDistribution: document.getElementById('letterDistribution'),
        gameFrame: document.getElementById('gameFrame'),
        gameOverlay: document.getElementById('gameOverlay'),
        closeButton: document.getElementById('closeButton'),
        progressBar: document.getElementById('progressBar'),
        dropdown: document.querySelector('#menu'),
    };
    let gameLinks = {};

    const loadGames = (fileName) => {
        const { categorySelect, searchBar, filterCloneOf, gameList, gameCount, letterDistribution } = elements;
        fetch(`romlists/${fileName}.txt`)
            .then(response => response.ok ? response.text() : Promise.reject('Failed to load file'))
            .then(contents => {
                const excludedKeywords = ['bios', 'test', 'demo', 'in-1'];
                const [games, letterCounts, categories] = contents.split('\n').slice(1).reduce(([games, letterCounts, categories], line) => {
                    const parts = line.split(';');
                    if (!parts[1]) return [games, letterCounts, categories];
                    const title = parts[1].toLowerCase();
                    const firstLetter = /[A-Z]/.test(title[0].toUpperCase()) ? title[0].toUpperCase() : '#';
                    if ((!filterCloneOf.checked || !parts[3]) &&
                        !excludedKeywords.some(keyword => title.includes(keyword)) &&
                        (!categorySelect.value || parts[6] === categorySelect.value) &&
                        (!searchBar.value || title.includes(searchBar.value.trim().toLowerCase()))) {
                        letterCounts[firstLetter] = (letterCounts[firstLetter] || 0) + 1;
                        if (parts[6]?.trim()) categories.add(parts[6].trim());
                        games.push({
                            title: parts[1],
                            url: getGameUrl(parts[0], fileName),
                            imageUrl: `${gameLinks[fileName]?.imagePath || 'snap/'}${parts[0]}.png`
                        });
                    }
                    return [games, letterCounts, categories];
                }, [[], {}, new Set()]);
                games.sort((a, b) => a.title.localeCompare(b.title));

                gameCount.textContent = `${games.length} games`;
                gameList.innerHTML = games.map(game => `
                    <div class="item" data-url="${game.url}">
                        <img data-src="${game.imageUrl}" class="lazy" alt="${game.title}" onerror="this.src='https://via.placeholder.com/512x409.6?text=No+Image'">
                        <p>${game.title}</p>
                    </div>
                `).join('');
                
                updateLetterDistribution(letterCounts, games.length);
                lazyLoadImages();

                document.querySelectorAll('.item').forEach(item => {
                    item.addEventListener('click', () => {
                        elements.gameFrame.src = `load.html?core=${gameLinks[fileName].core}&url=${encodeURIComponent(item.getAttribute('data-url'))}`;
                        elements.gameOverlay.style.display = 'flex';
                    });
                });

                elements.closeButton.addEventListener('click', () => {
                    elements.gameOverlay.style.display = 'none';
                    elements.gameFrame.src = '';
                });

                populateCategoryMenu([...categories].sort());
            });
    };

    const getGameUrl = (gameId, system) => {
        const gameData = gameLinks[system];
        if (!gameData) return null;
        if (system === "PlayStation") {
            const region = Object.keys(gameData.baseUrls).find(region => gameId.includes(region));
            return region ? `${gameData.baseUrls[region]}${encodeURIComponent(gameId)}.chd` : null;
        }
        return `${gameData.url}${encodeURIComponent(gameId)}.zip`;
    };

    const populateCategoryMenu = (categories) => {
        const { categorySelect } = elements;
        const currentSelection = categorySelect.value;
        categorySelect.innerHTML = '<option value="">All Genre</option>' + categories.map(category => `
            <option value="${category}">${category}</option>
        `).join('');
        categorySelect.value = currentSelection;
    };

    const updateLetterDistribution = (letterCounts, totalGames) => {
        const { letterDistribution } = elements;
        letterDistribution.innerHTML = '';
        const containerWidth = letterDistribution.clientWidth;

        Object.keys(letterCounts).sort().forEach(letter => {
            const bar = document.createElement('div');
            bar.className = 'letter-bar';
            bar.style.width = `${(letterCounts[letter] / totalGames) * containerWidth}px`;
            bar.textContent = letter;
            bar.addEventListener('click', () => scrollToLetter(letter));
            letterDistribution.appendChild(bar);
        });
    };

    const scrollToLetter = (letter) => {
        const targetGame = Array.from(elements.gameList.children).find(game => {
            const firstLetter = /[A-Z]/.test(game.querySelector('p').textContent.trim()[0].toUpperCase()) ? game.querySelector('p').textContent.trim()[0].toUpperCase() : '#';
            return firstLetter === letter;
        });
        if (targetGame) targetGame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('.lazy');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.onload = () => img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(image => observer.observe(image));
    };

    fetch('https://raw.githubusercontent.com/longhai/longhai.github.io/main/gamedata.json')
        .then(response => response.json())
        .then(data => {
            gameLinks = data;
            elements.dropdown.innerHTML = Object.keys(data).map(system => `
                <li data-value="${system}" logo="${data[system].logo}">
                    <img src="${data[system].logo}"/>
                    <span>${system}</span>
                </li>
            `).join('');
            if (elements.dropdown.children.length > 0) {
                updateSystemSelection(elements.dropdown.children[0]);
            }
        })
        .catch(error => console.error('Error loading game links:', error));

    const updateSystemSelection = (selectedItem) => {
        const system = selectedItem.dataset.value;
        elements.systemSelectButton.innerHTML = `
            <img src="${selectedItem.getAttribute('logo')}"/>
            <span>${system}</span>
        `;
        loadGames(system);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        elements.dropdown.classList.remove('show');
    };

    elements.systemSelectButton.addEventListener('click', () => elements.dropdown.classList.toggle('show'));
    elements.dropdown.addEventListener('click', event => {
        if (event.target.closest('li')) updateSystemSelection(event.target.closest('li'));
    });
    document.addEventListener('click', event => {
        if (!elements.dropdown.contains(event.target) && !elements.systemSelectButton.contains(event.target)) {
            elements.dropdown.classList.remove('show');
        }
    });

    ['change', 'input'].forEach(event => {
        elements.filterCloneOf.addEventListener(event, () => loadGames(elements.systemSelectButton.textContent.trim()));
        elements.categorySelect.addEventListener(event, () => loadGames(elements.systemSelectButton.textContent.trim()));
        elements.searchBar.addEventListener(event, () => loadGames(elements.systemSelectButton.textContent.trim()));
    });

    window.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        elements.progressBar.style.width = `${(scrollTop / (scrollHeight - clientHeight)) * 100}%`;
        const visibleLetters = new Set(Array.from(elements.gameList.children).filter(game => {
            const rect = game.getBoundingClientRect();
            return rect.top + window.scrollY < window.scrollY + window.innerHeight && rect.bottom + window.scrollY > window.scrollY;
        }).map(game => {
            return /[A-Z]/.test(game.querySelector('p').textContent.trim()[0].toUpperCase()) ? game.querySelector('p').textContent.trim()[0].toUpperCase() : '#';
        }));
        document.querySelectorAll('#letterDistribution .letter-bar').forEach(bar => {
            bar.classList.toggle('active', visibleLetters.has(bar.textContent));
        });
    });

    loadGames(elements.systemSelectButton.textContent.trim());
});
