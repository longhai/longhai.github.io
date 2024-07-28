document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu li');
    const categorySelect = document.getElementById('categoryFilter');

    if (menuItems.length) {
        menuItems[0].classList.add('active');
        loadGames(menuItems[0].textContent.trim());
    }

    menuItems.forEach(item =>
        item.addEventListener('click', () => {
            categorySelect.value = '';
            setActiveMenuItem(item);
            loadGames(item.textContent.trim());
        })
    );

    document.getElementById('filterCloneOf').addEventListener('change', () => {
        const activeMenuItem = document.querySelector('.menu li.active');
        if (activeMenuItem) {
            loadGames(activeMenuItem.textContent.trim());
        }
    });

    categorySelect.addEventListener('change', () => {
        const activeMenuItem = document.querySelector('.menu li.active');
        if (activeMenuItem) {
            loadGames(activeMenuItem.textContent.trim());
        }
    });

    window.addEventListener('scroll', () => {
        updateProgressBar();
        updateActiveLetterBar();
    });
    updateProgressBar(); // Initialize progress bar
});

function setActiveMenuItem(item) {
    document.querySelectorAll('.menu li').forEach(menuItem => {
        menuItem.classList.remove('active');
    });
    item.classList.add('active');
}

function loadGames(fileName) {
    const fileUrl = `https://longhai.github.io/romlists/${fileName}.txt`;
    const selectedCategory = document.getElementById('categoryFilter').value;
    const excludeCloneOf = document.getElementById('filterCloneOf').checked;
    const excludedKeywords = ['bios', 'test', 'demo', 'in-1'];

    fetch(fileUrl)
        .then(response => response.ok ? response.text() : Promise.reject('Failed to load file'))
        .then(contents => {
            const lines = contents.split('\n').slice(1);
            const categories = new Set();
            const letterCounts = {};
            const games = lines.map(line => line.split(';')).filter(parts => {
                if (parts[1]) { // Check if Title exists
                    let firstLetter = parts[1][0].toUpperCase();
                    if (!/[A-Z]/.test(firstLetter)) {
                        firstLetter = '#'; // Group special characters and numbers into #
                    }
                    if (!letterCounts[firstLetter]) {
                        letterCounts[firstLetter] = 0;
                    }
                    letterCounts[firstLetter]++;
                    if (parts[6] && parts[6].trim()) { // Avoid empty categories
                        categories.add(parts[6].trim()); // Collect categories
                    }
                    return !excludeCloneOf || !parts[3]; // Exclude CloneOf if checkbox is checked
                }
                return false;
            }).filter(parts => !excludedKeywords.some(keyword => parts[1].toLowerCase().includes(keyword)))
                .filter(parts => !selectedCategory || parts[6] === selectedCategory) // Filter by selected category
                .map(parts => ({
                    title: parts[1],
                    imageUrl: `https://longhai.github.io/snap/${fileName}/${parts[1]}.png`
                }))
                .sort((a, b) => a.title.localeCompare(b.title));

            // Recalculate letterCounts after filtering by category
            const filteredLetterCounts = {};
            games.forEach(game => {
                let firstLetter = game.title[0].toUpperCase();
                if (!/[A-Z]/.test(firstLetter)) {
                    firstLetter = '#'; // Group special characters and numbers into #
                }
                if (!filteredLetterCounts[firstLetter]) {
                    filteredLetterCounts[firstLetter] = 0;
                }
                filteredLetterCounts[firstLetter]++;
            });

            const gameCount = games.length;
            document.getElementById('gameCount').textContent = `Total games: ${gameCount}`;

            const gameListHTML = games.map(game => {
                const { title, imageUrl } = game;
                return `
                    <div>
                        <img 
                            data-src="${imageUrl}" 
                            class="lazy" 
                            alt="${title}" 
                            onerror="this.src='https://via.placeholder.com/512x409.6?text=No+Image'">
                        <span>${title}</span>
                    </div>
                `;
            }).join('');

            document.getElementById('gameList').innerHTML = gameListHTML;
            lazyLoadImages();

            populateCategoryMenu(Array.from(categories).sort());
            updateLetterDistribution(filteredLetterCounts, games.length);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('gameCount').textContent = 'Total games: 0';
            document.getElementById('gameList').innerHTML = '';
            document.getElementById('letterDistribution').innerHTML = '';
        });
}

function populateCategoryMenu(categories) {
    const categorySelect = document.getElementById('categoryFilter');
    const currentSelection = categorySelect.value;

    const validCategories = categories.filter(category => category.trim() !== '');

    categorySelect.innerHTML = '<option value="">All Categories</option>' +
        validCategories.map(category => `<option value="${category}">${category}</option>`).join('');

    categorySelect.value = currentSelection;
}

function updateLetterDistribution(letterCounts, totalGames) {
    const letterContainer = document.getElementById('letterDistribution');
    letterContainer.innerHTML = ''; // Clear previous content

    const letters = Object.keys(letterCounts).sort();
    const containerWidth = letterContainer.clientWidth;

    letters.forEach(letter => {
        const count = letterCounts[letter];
        const percentage = (count / totalGames) * 100;
        const barWidth = (containerWidth * percentage) / 100;
        const bar = document.createElement('div');
        bar.className = 'letter-bar';
        bar.style.width = `${barWidth}px`;
        bar.textContent = letter;
        letterContainer.appendChild(bar);

        // Add click event listener to scroll to the first game with this letter
        bar.addEventListener('click', () => scrollToLetter(letter));
    });
}

function scrollToLetter(letter) {
    const gameList = document.getElementById('gameList');
    const games = Array.from(gameList.children);
    const targetGame = games.find(game => {
        let gameTitleFirstLetter = game.querySelector('span').textContent.trim()[0].toUpperCase();
        if (!/[A-Z]/.test(gameTitleFirstLetter)) {
            gameTitleFirstLetter = '#'; // Group special characters and numbers into #
        }
        return gameTitleFirstLetter === letter;
    });

    if (targetGame) {
        targetGame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateProgressBar() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
    document.getElementById('progressBar').style.width = `${scrolled}%`;
}

function updateActiveLetterBar() {
    const letterBars = document.querySelectorAll('#letterDistribution .letter-bar');
    const gameList = document.getElementById('gameList');

    if (gameList.children.length === 0) return;

    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;

    const visibleGames = Array.from(gameList.children).filter(game => {
        const rect = game.getBoundingClientRect();
        return rect.top + window.scrollY < viewportBottom && rect.bottom + window.scrollY > viewportTop;
    });

    const visibleLetters = new Set(visibleGames.map(game => {
        let gameTitleFirstLetter = game.querySelector('span').textContent.trim()[0].toUpperCase();
        if (!/[A-Z]/.test(gameTitleFirstLetter)) {
            gameTitleFirstLetter = '#'; // Group special characters and numbers into #
        }
        return gameTitleFirstLetter;
    }));

    letterBars.forEach(bar => {
        const letter = bar.textContent.trim();
        if (visibleLetters.has(letter)) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('.lazy');
    const lazyLoad = image => {
        const src = image.getAttribute('data-src');
        if (src) {
            image.src = src;
            image.onload = () => image.removeAttribute('data-src');
        }
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                lazyLoad(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });

    lazyImages.forEach(image => {
        observer.observe(image);
    });
}
