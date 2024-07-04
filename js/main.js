import "./menu.js";
import GameManager from './gameManager.js'; // Import GameManager from file gameManager.js
import './gamepad.js'; // Import gamepad from file gamepad.js

document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    const menu = document.getElementById('menu');
    const searchInput = document.getElementById('searchInput');
    const letterButtonsContainer = document.getElementById('letter-buttons');
    const alphabet = ['All', '#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
    let isPlayingGame = false; // Variable to check the game playing status

    menu.addEventListener('click', handleMenuClick);
    searchInput.addEventListener('input', handleSearchInput);
    document.getElementById('closeButton').addEventListener('click', handleCloseButtonClick);
    document.getElementById('nextBtn').addEventListener('click', handleNextButtonClick);
    document.getElementById('prevBtn').addEventListener('click', handlePrevButtonClick);

    alphabet.forEach(letter => createLetterChip(letter, gameManager));
    enableHorizontalScroll(letterButtonsContainer);

    gameManager.loadMenuContent(menu.children[0]);

    // Register gamepad events
    gamepad.init();
    gamepad.on('button', handleGamepadButton); // Handle gamepad button events

    function handleMenuClick(e) {
        if (e.target && e.target.nodeName === 'LI') {
            gameManager.currentPage = 1;
            gameManager.loadMenuContent(e.target);
        }
    }

    function handleSearchInput(e) {
        gameManager.searchKeyword = e.target.value.toLowerCase();
        gameManager.renderGames(gameManager.currentPage);
    }

    function handleCloseButtonClick() {
        document.getElementById('gameFrame').src = '';
        document.getElementById('gameOverlay').style.display = 'none';
        isPlayingGame = false; // Reset status when closing the game player
    }

    function handleNextButtonClick() {
        if (gameManager.currentPage < Math.ceil(gameManager.filteredGames.length / gameManager.gamesPerPage)) {
            gameManager.currentPage++;
            gameManager.renderGames(gameManager.currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top of the page when changing pages
        }
    }

    function handlePrevButtonClick() {
        if (gameManager.currentPage > 1) {
            gameManager.currentPage--;
            gameManager.renderGames(gameManager.currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function createLetterChip(letter, gameManager) {
        const chip = document.createElement('div');
        chip.classList.add('chip');
        chip.setAttribute('data-style', 'home');
        chip.setAttribute('data-letter', letter);
        if (letter === 'All') {
            chip.setAttribute('selected', '');
        }
        chip.innerHTML = `<div class="chip-container"><span class="chip-text">${letter}</span></div>`;
        chip.addEventListener('click', function () {
            document.querySelectorAll('.chip').forEach(elem => elem.removeAttribute('selected'));
            this.setAttribute('selected', '');
            gameManager.selectedLetter = letter;
            gameManager.renderGames(gameManager.currentPage);
        });
        letterButtonsContainer.appendChild(chip);
    }

    function enableHorizontalScroll(container) {
        container.addEventListener('wheel', function (event) {
            this.scrollLeft += event.deltaY;
            event.preventDefault();
        });
    }

    // Handle gamepad events
    function handleGamepadButton(index, value) {
        if (index === 0 && value === 1 && !isPlayingGame) { // If A button is pressed on the gamepad and not playing a game
            // Handle when A button is pressed to play the game
            const currentSelected = document.querySelector('.game.selected');
            if (currentSelected) {
                const gameUrl = currentSelected.querySelector('img').getAttribute('data-gameurl');
                gameManager.playGame(gameManager.currentCore, gameUrl);
                isPlayingGame = true; // Set status when playing the game
            }
        } else if (index === 12 && value === 1 && !isPlayingGame) { // If Up button is pressed on the gamepad and not playing a game
            // Handle when Up button is pressed
            const currentSelected = document.querySelector('.game.selected');
            let previousSelected;

            if (currentSelected) {
                previousSelected = currentSelected.previousElementSibling || currentSelected.parentElement.lastElementChild;
                currentSelected.classList.remove('selected');

                if (previousSelected === currentSelected.parentElement.lastElementChild && currentSelected === currentSelected.parentElement.firstElementChild) {
                    // If at the top of the page, go back to the previous page and select the last item on the previous page
                    const prevPageBtn = document.getElementById('prevBtn');
                    if (prevPageBtn && !prevPageBtn.disabled) {
                        prevPageBtn.click(); // Trigger page change event
                        setTimeout(() => {
                            const lastGameOnPrevPage = document.querySelector('.game:last-of-type');
                            if (lastGameOnPrevPage) {
                                lastGameOnPrevPage.classList.add('selected');
                                ensureGameVisible(lastGameOnPrevPage); // Ensure the selected game is visible on the screen
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of the page when changing pages with the gamepad
                            }
                        }, 100); // Wait 100ms to ensure the previous page has loaded completely
                    }
                    return;
                }
            } else {
                previousSelected = document.querySelector('.game');
            }

            if (previousSelected) {
                previousSelected.classList.add('selected');
                ensureGameVisible(previousSelected); // Ensure the selected game is visible on the screen
            }
        } else if (index === 13 && value === 1 && !isPlayingGame) { // If Down button is pressed on the gamepad and not playing a game
            // Handle when Down button is pressed
            const currentSelected = document.querySelector('.game.selected');
            let nextSelected;

            if (currentSelected) {
                nextSelected = currentSelected.nextElementSibling;
                if (!nextSelected) {
                    // If no next element, i.e., at the end of the list
                    const nextPageBtn = document.getElementById('nextBtn');
                    if (nextPageBtn && !nextPageBtn.disabled) {
                        // If Next button is not disabled, automatically change page and select the first item on the new page
                        nextPageBtn.click(); // Trigger page change event
                        setTimeout(() => {
                            const firstGameOnNextPage = document.querySelector('.game');
                            if (firstGameOnNextPage) {
                                firstGameOnNextPage.classList.add('selected');
                                ensureGameVisible(firstGameOnNextPage); // Ensure the selected game is visible on the screen
                                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top of the page when changing pages with the gamepad
                            }
                        }, 100); // Wait 100ms to ensure the new page has loaded completely
                    }
                    return;
                }
                currentSelected.classList.remove('selected');
            } else {
                nextSelected = document.querySelector('.game');
            }

            if (nextSelected) {
                nextSelected.classList.add('selected');
                ensureGameVisible(nextSelected); // Ensure the selected game is visible on the screen
            }
        } else if (index === 10 && value === 1) { // If button 11 (Button 10) is pressed on the gamepad
            // Handle when button 11 is pressed to close the game player
            const closeButton = document.getElementById('closeButton');
            if (closeButton) {
                closeButton.click(); // Trigger click event of the close button
            }
        }
    }

    function ensureGameVisible(gameElement) {
        // Check if gameElement is outside the visible area of the screen, scroll the screen to make gameElement visible
        const rect = gameElement.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            gameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
});
